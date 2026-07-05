package com.examprep.note.dto;

import com.examprep.note.NoteType;

import jakarta.validation.constraints.NotNull;

public record NoteRequest(
    Long topicId,
    @NotNull NoteType type,
    String textContent,
    String imageData) {
}
