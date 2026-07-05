package com.examprep.note;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.examprep.config.AuthUser;
import com.examprep.note.dto.NoteRequest;
import com.examprep.note.dto.NoteResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping("/courses/{courseId}/notes")
    public List<NoteResponse> list(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId) {
        return noteService.list(user.id(), courseId);
    }

    @PostMapping("/courses/{courseId}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteResponse create(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId,
            @Valid @RequestBody NoteRequest request) {
        return noteService.create(user.id(), courseId, request);
    }

    @PutMapping("/notes/{id}")
    public NoteResponse update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
            @Valid @RequestBody NoteRequest request) {
        return noteService.update(user.id(), id, request);
    }

    @DeleteMapping("/notes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        noteService.delete(user.id(), id);
    }
}
