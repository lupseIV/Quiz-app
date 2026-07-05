package com.examprep.mindmap.dto;

import java.time.Instant;

import com.examprep.mindmap.MindMap;
import tools.jackson.databind.JsonNode;

public final class MindMapDtos {

    private MindMapDtos() {
    }

    public record GenerateRequest(Long topicId) {
    }

    public record MindMapResponse(Long id, Long courseId, Long topicId, String title,
            JsonNode nodes, Instant createdAt) {

        public static MindMapResponse from(MindMap map, JsonNode nodes) {
            return new MindMapResponse(map.getId(), map.getCourseId(), map.getTopicId(),
                map.getTitle(), nodes, map.getCreatedAt());
        }
    }
}
