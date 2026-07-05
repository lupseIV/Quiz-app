package com.examprep.topic.dto;

import com.examprep.topic.Topic;

public record TopicResponse(Long id, Long courseId, String title, String content) {

    public static TopicResponse from(Topic topic) {
        return new TopicResponse(topic.getId(), topic.getCourseId(), topic.getTitle(), topic.getContent());
    }
}
