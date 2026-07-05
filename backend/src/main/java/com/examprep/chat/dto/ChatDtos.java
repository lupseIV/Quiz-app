package com.examprep.chat.dto;

import java.time.Instant;

import com.examprep.chat.ChatMessage;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ChatDtos {

    private ChatDtos() {
    }

    public record ChatRequest(@NotBlank @Size(max = 4000) String message) {
    }

    public record ChatMessageResponse(Long id, String role, String content, Instant createdAt) {

        public static ChatMessageResponse from(ChatMessage message) {
            return new ChatMessageResponse(message.getId(), message.getRole().name().toLowerCase(),
                message.getContent(), message.getCreatedAt());
        }
    }
}
