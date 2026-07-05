package com.examprep.topic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TopicRequest(
    @NotBlank @Size(max = 300) String title,
    String content) {
}
