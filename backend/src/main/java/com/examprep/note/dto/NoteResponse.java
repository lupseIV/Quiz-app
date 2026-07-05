package com.examprep.note.dto;

import java.time.Instant;

import com.examprep.note.Note;
import com.examprep.note.NoteType;

public record NoteResponse(Long id, Long courseId, Long topicId, NoteType type,
        String textContent, String imageData, Instant createdAt, Instant updatedAt) {

    public static NoteResponse from(Note note) {
        return new NoteResponse(note.getId(), note.getCourseId(), note.getTopicId(), note.getType(),
            note.getTextContent(), note.getImageData(), note.getCreatedAt(), note.getUpdatedAt());
    }
}
