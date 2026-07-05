package com.examprep.topic;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.examprep.common.NotFoundException;
import com.examprep.course.CourseService;
import com.examprep.topic.dto.TopicRequest;
import com.examprep.topic.dto.TopicResponse;

@Service
public class TopicService {

    private final TopicRepository topicRepository;
    private final CourseService courseService;

    public TopicService(TopicRepository topicRepository, CourseService courseService) {
        this.topicRepository = topicRepository;
        this.courseService = courseService;
    }

    public List<TopicResponse> list(Long userId, Long courseId) {
        courseService.getOwned(userId, courseId);
        return topicRepository.findByCourseIdOrderByIdAsc(courseId).stream()
            .map(TopicResponse::from)
            .toList();
    }

    public TopicResponse create(Long userId, Long courseId, TopicRequest request) {
        courseService.getOwned(userId, courseId);
        Topic topic = new Topic(courseId, request.title(), request.content());
        return TopicResponse.from(topicRepository.save(topic));
    }

    @Transactional
    public TopicResponse update(Long userId, Long topicId, TopicRequest request) {
        Topic topic = getOwned(userId, topicId);
        topic.update(request.title(), request.content());
        return TopicResponse.from(topic);
    }

    public void delete(Long userId, Long topicId) {
        topicRepository.delete(getOwned(userId, topicId));
    }

    private Topic getOwned(Long userId, Long topicId) {
        Topic topic = topicRepository.findById(topicId)
            .orElseThrow(() -> new NotFoundException("Topic " + topicId + " not found"));
        courseService.getOwned(userId, topic.getCourseId());
        return topic;
    }
}
