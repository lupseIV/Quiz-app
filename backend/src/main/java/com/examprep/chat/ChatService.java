package com.examprep.chat;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.examprep.ai.AiRateLimiter;
import com.examprep.ai.AiService;
import com.examprep.chat.dto.ChatDtos.ChatMessageResponse;
import com.examprep.course.Course;
import com.examprep.course.CourseService;
import com.examprep.topic.Topic;
import com.examprep.topic.TopicRepository;

@Service
public class ChatService {

    /** Cap the number of past turns sent to Claude so context stays bounded. */
    private static final int HISTORY_LIMIT = 20;

    private final ChatMessageRepository chatRepository;
    private final TopicRepository topicRepository;
    private final CourseService courseService;
    private final AiService aiService;
    private final AiRateLimiter rateLimiter;

    public ChatService(ChatMessageRepository chatRepository, TopicRepository topicRepository,
            CourseService courseService, AiService aiService, AiRateLimiter rateLimiter) {
        this.chatRepository = chatRepository;
        this.topicRepository = topicRepository;
        this.courseService = courseService;
        this.aiService = aiService;
        this.rateLimiter = rateLimiter;
    }

    @Transactional
    public ChatMessageResponse send(Long userId, Long courseId, String userMessage) {
        Course course = courseService.getOwned(userId, courseId);
        rateLimiter.checkAndRecord(userId);

        chatRepository.save(new ChatMessage(courseId, ChatMessage.Role.USER, userMessage));

        List<AiService.Message> conversation = new ArrayList<>();
        List<ChatMessage> history = chatRepository.findByCourseIdOrderByCreatedAtAsc(courseId);
        history.stream()
            .skip(Math.max(0, history.size() - HISTORY_LIMIT))
            .forEach(m -> conversation.add(new AiService.Message(
                m.getRole() == ChatMessage.Role.USER ? "user" : "assistant", m.getContent())));

        String reply = aiService.complete(buildSystemPrompt(course), conversation);
        ChatMessage saved = chatRepository.save(
            new ChatMessage(courseId, ChatMessage.Role.ASSISTANT, reply));
        return ChatMessageResponse.from(saved);
    }

    public List<ChatMessageResponse> history(Long userId, Long courseId) {
        courseService.getOwned(userId, courseId);
        return chatRepository.findByCourseIdOrderByCreatedAtAsc(courseId).stream()
            .map(ChatMessageResponse::from)
            .toList();
    }

    private String buildSystemPrompt(Course course) {
        StringBuilder material = new StringBuilder();
        for (Topic topic : topicRepository.findByCourseIdOrderByIdAsc(course.getId())) {
            if (topic.getContent() != null && !topic.getContent().isBlank()) {
                material.append("## ").append(topic.getTitle()).append('\n')
                    .append(topic.getContent()).append("\n\n");
            }
        }
        return """
            You are a study tutor for the course "%s". Answer the student's questions \
            grounded in the course material below. If the material doesn't cover the \
            question, say so before answering from general knowledge. Be concise and \
            focus on helping the student understand and remember.

            COURSE MATERIAL:
            %s""".formatted(course.getName(),
                material.isEmpty() ? "(no topics added yet)" : material.toString());
    }
}
