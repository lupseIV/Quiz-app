package com.examprep.quiz;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.examprep.ai.AiRateLimiter;
import com.examprep.ai.AiService;
import com.examprep.common.AiException;
import com.examprep.common.NotFoundException;
import com.examprep.course.Course;
import com.examprep.course.CourseService;
import com.examprep.quiz.dto.QuizDtos.AttemptSummary;
import com.examprep.quiz.dto.QuizDtos.GeneratedQuiz;
import com.examprep.quiz.dto.QuizDtos.QuestionResult;
import com.examprep.quiz.dto.QuizDtos.QuestionView;
import com.examprep.quiz.dto.QuizDtos.QuizResult;
import com.examprep.quiz.dto.QuizDtos.QuizSubmission;
import com.examprep.topic.Topic;
import com.examprep.topic.TopicRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
public class QuizService {

    private static final String SYSTEM_PROMPT = """
        You are a quiz generator for a student exam-prep app. You always respond with a \
        single JSON array and nothing else — no prose, no markdown fences. Each element \
        must be an object with exactly these keys: "question" (string), "options" (array \
        of exactly 4 distinct strings), "correctAnswer" (string, must be one of the \
        options). Questions must be answerable from the provided course material only.""";

    private final QuizAttemptRepository attemptRepository;
    private final QuizQuestionRepository questionRepository;
    private final TopicRepository topicRepository;
    private final CourseService courseService;
    private final AiService aiService;
    private final AiRateLimiter rateLimiter;
    private final ObjectMapper objectMapper;
    private final int questionCount;

    public QuizService(QuizAttemptRepository attemptRepository,
            QuizQuestionRepository questionRepository,
            TopicRepository topicRepository,
            CourseService courseService,
            AiService aiService,
            AiRateLimiter rateLimiter,
            ObjectMapper objectMapper,
            @Value("${app.ai.quiz-question-count:5}") int questionCount) {
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.topicRepository = topicRepository;
        this.courseService = courseService;
        this.aiService = aiService;
        this.rateLimiter = rateLimiter;
        this.objectMapper = objectMapper;
        this.questionCount = questionCount;
    }

    @Transactional
    public GeneratedQuiz generate(Long userId, Long courseId) {
        Course course = courseService.getOwned(userId, courseId);
        List<Topic> topics = topicRepository.findByCourseIdOrderByIdAsc(courseId);
        String material = buildMaterial(topics);
        if (material.isBlank()) {
            throw new IllegalArgumentException(
                "Add at least one topic with content before generating a quiz");
        }
        rateLimiter.checkAndRecord(userId);

        String userPrompt = "Generate exactly " + questionCount
            + " multiple-choice questions for the course \"" + course.getName()
            + "\" based on this material:\n\n" + material;
        JsonNode json = aiService.extractJson(aiService.complete(SYSTEM_PROMPT, userPrompt));
        List<ParsedQuestion> parsed = parseAndValidate(json);

        QuizAttempt attempt = attemptRepository.save(new QuizAttempt(courseId, parsed.size()));
        List<QuestionView> views = new ArrayList<>();
        for (ParsedQuestion q : parsed) {
            QuizQuestion saved = questionRepository.save(new QuizQuestion(
                attempt.getId(), q.question(), writeJson(q.options()), q.correctAnswer()));
            views.add(new QuestionView(saved.getId(), q.question(), q.options()));
        }
        return new GeneratedQuiz(attempt.getId(), views);
    }

    @Transactional
    public QuizResult submit(Long userId, Long courseId, Long quizId, QuizSubmission submission) {
        courseService.getOwned(userId, courseId);
        QuizAttempt attempt = attemptRepository.findById(quizId)
            .filter(a -> a.getCourseId().equals(courseId))
            .orElseThrow(() -> new NotFoundException("Quiz " + quizId + " not found"));
        if (attempt.isSubmitted()) {
            throw new IllegalArgumentException("This quiz has already been submitted");
        }

        Map<Long, String> answers = new HashMap<>();
        submission.answers().forEach(a -> answers.put(a.questionId(), a.answer()));

        List<QuizQuestion> questions = questionRepository.findByQuizAttemptIdOrderByIdAsc(quizId);
        int score = 0;
        List<QuestionResult> results = new ArrayList<>();
        for (QuizQuestion q : questions) {
            q.setUserAnswer(answers.get(q.getId()));
            if (q.isCorrect()) {
                score++;
            }
            results.add(toResult(q));
        }
        attempt.setScore(score);
        return new QuizResult(quizId, score, questions.size(), results);
    }

    public List<AttemptSummary> history(Long userId, Long courseId) {
        courseService.getOwned(userId, courseId);
        return attemptRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
            .map(a -> new AttemptSummary(a.getId(), a.getScore(), a.getTotalQuestions(), a.getCreatedAt()))
            .toList();
    }

    public QuizResult getResult(Long userId, Long courseId, Long quizId) {
        courseService.getOwned(userId, courseId);
        QuizAttempt attempt = attemptRepository.findById(quizId)
            .filter(a -> a.getCourseId().equals(courseId) && a.isSubmitted())
            .orElseThrow(() -> new NotFoundException("Quiz result " + quizId + " not found"));
        List<QuestionResult> results = questionRepository.findByQuizAttemptIdOrderByIdAsc(quizId).stream()
            .map(this::toResult)
            .toList();
        return new QuizResult(quizId, attempt.getScore(), attempt.getTotalQuestions(), results);
    }

    private QuestionResult toResult(QuizQuestion q) {
        return new QuestionResult(q.getId(), q.getQuestionText(), readOptions(q.getOptionsJson()),
            q.getCorrectAnswer(), q.getUserAnswer(), q.isCorrect());
    }

    private String buildMaterial(List<Topic> topics) {
        StringBuilder sb = new StringBuilder();
        for (Topic topic : topics) {
            if (topic.getContent() != null && !topic.getContent().isBlank()) {
                sb.append("## ").append(topic.getTitle()).append('\n')
                  .append(topic.getContent()).append("\n\n");
            }
        }
        return sb.toString();
    }

    /** Validates the AI's JSON so a malformed response never reaches the frontend. */
    private List<ParsedQuestion> parseAndValidate(JsonNode json) {
        if (!json.isArray() || json.isEmpty()) {
            throw new AiException("Claude did not return a question array");
        }
        List<ParsedQuestion> parsed = new ArrayList<>();
        for (JsonNode node : json) {
            String question = node.path("question").asString("");
            String correct = node.path("correctAnswer").asString("");
            JsonNode optionsNode = node.path("options");
            if (question.isBlank() || correct.isBlank() || !optionsNode.isArray()
                    || optionsNode.size() < 2) {
                throw new AiException("Claude returned a malformed question");
            }
            List<String> options = new ArrayList<>();
            optionsNode.forEach(o -> options.add(o.asString()));
            if (!options.contains(correct)) {
                throw new AiException("Claude returned a correct answer not present in the options");
            }
            parsed.add(new ParsedQuestion(question, options, correct));
        }
        return parsed;
    }

    private String writeJson(List<String> options) {
        try {
            return objectMapper.writeValueAsString(options);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize options", e);
        }
    }

    private List<String> readOptions(String optionsJson) {
        try {
            return objectMapper.readValue(optionsJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            throw new IllegalStateException("Failed to deserialize options", e);
        }
    }

    private record ParsedQuestion(String question, List<String> options, String correctAnswer) {
    }
}
