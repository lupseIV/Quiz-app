package com.examprep.note;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.examprep.common.NotFoundException;
import com.examprep.course.CourseService;
import com.examprep.note.dto.NoteRequest;
import com.examprep.note.dto.NoteResponse;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final CourseService courseService;

    public NoteService(NoteRepository noteRepository, CourseService courseService) {
        this.noteRepository = noteRepository;
        this.courseService = courseService;
    }

    public List<NoteResponse> list(Long userId, Long courseId) {
        courseService.getOwned(userId, courseId);
        return noteRepository.findByCourseIdOrderByCreatedAtDesc(courseId).stream()
            .map(NoteResponse::from)
            .toList();
    }

    public NoteResponse create(Long userId, Long courseId, NoteRequest request) {
        courseService.getOwned(userId, courseId);
        validate(request);
        Note note = new Note(courseId, request.topicId(), request.type(),
            request.textContent(), request.imageData());
        return NoteResponse.from(noteRepository.save(note));
    }

    @Transactional
    public NoteResponse update(Long userId, Long noteId, NoteRequest request) {
        Note note = getOwned(userId, noteId);
        validate(request);
        note.update(request.textContent(), request.imageData());
        return NoteResponse.from(note);
    }

    public void delete(Long userId, Long noteId) {
        noteRepository.delete(getOwned(userId, noteId));
    }

    private void validate(NoteRequest request) {
        if (request.type() == NoteType.TEXT && (request.textContent() == null || request.textContent().isBlank())) {
            throw new IllegalArgumentException("Text notes require textContent");
        }
        if (request.type() == NoteType.DRAWING && (request.imageData() == null || request.imageData().isBlank())) {
            throw new IllegalArgumentException("Drawing notes require imageData");
        }
    }

    private Note getOwned(Long userId, Long noteId) {
        Note note = noteRepository.findById(noteId)
            .orElseThrow(() -> new NotFoundException("Note " + noteId + " not found"));
        courseService.getOwned(userId, note.getCourseId());
        return note;
    }
}
