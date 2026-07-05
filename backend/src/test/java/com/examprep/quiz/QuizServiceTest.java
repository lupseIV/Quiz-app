package com.examprep.quiz;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.invocation.InvocationOnMock;

import com.examprep.ai.AiRateLimiter;
import com.examprep.ai.AiService;
import com.examprep.common.AiException;
import com.examprep.course.Course;
import com.examprep.course.CourseService;
import com.examprep.quiz.dto.QuizDtos.AnswerSubmission;
import com.examprep.quiz.dto.QuizDtos.GeneratedQuiz;
import com.examprep.quiz.dto.QuizDtos.QuizResult;
import com.examprep.quiz.dto.QuizDtos.QuizSubmission;
import com.examprep.topic.Topic;
import com.examprep.topic.TopicRepository;
import tools.jackson.databind.ObjectMapper;

class QuizServiceTest {

    private static final Long USER_ID = 1L;
    private static final Long COURSE_ID = 10L;

    private QuizAttemptRepository attemptRepository;
    private QuizQuestionRepository questionRepository;
    private TopicRepository topicRepository;
    private CourseService courseService;
    private AiService aiService;
    private AiRateLimiter rateLimiter;
    private QuizService quizService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        attemptRepository = mock(QuizAttemptRepository.class);
        questionRepository = mock(QuizQuestionRepository.class);
        topicRepository = mock(TopicRepository.class);
        courseService = mock(CourseService.class);
        aiService = mock(AiService.class);
        rateLimiter = mock(AiRateLimiter.class);
        quizService = new QuizService(attemptRepository, questionRepository, topicRepository,
            courseService, aiService, rateLimiter, objectMapper, 5);

        Course course = new Course(USER_ID, "Biology", null, null);
        when(courseService.getOwned(USER_ID, COURSE_ID)).thenReturn(course);
    }

    @Test
    void generateParsesAiJsonAndSavesQuestionsWithoutLeakingAnswers() throws Exception {
        when(topicRepository.findByCourseIdOrderByIdAsc(COURSE_ID))
            .thenReturn(List.of(new Topic(COURSE_ID, "Cells", "Cell content")));
        String aiJson = """
            [{"question": "What is ATP?",
              "options": ["Energy currency", "A protein", "A sugar", "A lipid"],
              "correctAnswer": "Energy currency"}]""";
        when(aiService.complete(anyString(), anyString())).thenReturn(aiJson);
        when(aiService.extractJson(aiJson)).thenReturn(objectMapper.readTree(aiJson));
        when(attemptRepository.save(any())).thenAnswer(inv -> withId(inv, 100L));
        when(questionRepository.save(any())).thenAnswer(inv -> withId(inv, 200L));

        GeneratedQuiz quiz = quizService.generate(USER_ID, COURSE_ID);

        assertThat(quiz.quizId()).isEqualTo(100L);
        assertThat(quiz.questions()).hasSize(1);
        assertThat(quiz.questions().getFirst().questionText()).isEqualTo("What is ATP?");
        assertThat(quiz.questions().getFirst().options()).hasSize(4);
        verify(rateLimiter).checkAndRecord(USER_ID);
    }

    @Test
    void generateRejectsCourseWithoutTopicContent() {
        when(topicRepository.findByCourseIdOrderByIdAsc(COURSE_ID)).thenReturn(List.of());

        assertThatThrownBy(() -> quizService.generate(USER_ID, COURSE_ID))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("topic");
    }

    @Test
    void generateRejectsMalformedAiResponse() throws Exception {
        when(topicRepository.findByCourseIdOrderByIdAsc(COURSE_ID))
            .thenReturn(List.of(new Topic(COURSE_ID, "Cells", "Cell content")));
        String badJson = """
            [{"question": "Q", "options": ["A", "B", "C", "D"], "correctAnswer": "Not an option"}]""";
        when(aiService.complete(anyString(), anyString())).thenReturn(badJson);
        when(aiService.extractJson(badJson)).thenReturn(objectMapper.readTree(badJson));

        assertThatThrownBy(() -> quizService.generate(USER_ID, COURSE_ID))
            .isInstanceOf(AiException.class);
    }

    @Test
    void submitScoresAnswersAndMarksAttemptSubmitted() {
        QuizAttempt attempt = withId(new QuizAttempt(COURSE_ID, 2), 100L);
        when(attemptRepository.findById(100L)).thenReturn(java.util.Optional.of(attempt));
        QuizQuestion q1 = withId(new QuizQuestion(100L, "Q1", "[\"A\",\"B\"]", "A"), 201L);
        QuizQuestion q2 = withId(new QuizQuestion(100L, "Q2", "[\"C\",\"D\"]", "D"), 202L);
        when(questionRepository.findByQuizAttemptIdOrderByIdAsc(100L)).thenReturn(List.of(q1, q2));

        QuizResult result = quizService.submit(USER_ID, COURSE_ID, 100L, new QuizSubmission(
            List.of(new AnswerSubmission(201L, "A"), new AnswerSubmission(202L, "C"))));

        assertThat(result.score()).isEqualTo(1);
        assertThat(result.totalQuestions()).isEqualTo(2);
        assertThat(result.questions().getFirst().correct()).isTrue();
        assertThat(result.questions().getLast().correct()).isFalse();
        assertThat(result.questions().getLast().correctAnswer()).isEqualTo("D");
        assertThat(attempt.getScore()).isEqualTo(1);
    }

    @Test
    void submitRejectsAlreadySubmittedQuiz() {
        QuizAttempt attempt = withId(new QuizAttempt(COURSE_ID, 1), 100L);
        attempt.setScore(1);
        when(attemptRepository.findById(100L)).thenReturn(java.util.Optional.of(attempt));

        assertThatThrownBy(() -> quizService.submit(USER_ID, COURSE_ID, 100L,
            new QuizSubmission(List.of(new AnswerSubmission(201L, "A")))))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("already");
    }

    @SuppressWarnings("unchecked")
    private static <T> T withId(InvocationOnMock invocation, Long id) {
        return withId((T) invocation.getArgument(0), id);
    }

    private static <T> T withId(T entity, Long id) {
        try {
            Field field = entity.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
            return entity;
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
