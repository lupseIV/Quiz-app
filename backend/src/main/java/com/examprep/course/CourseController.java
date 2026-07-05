package com.examprep.course;

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
import com.examprep.course.dto.CourseRequest;
import com.examprep.course.dto.CourseResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<CourseResponse> list(@AuthenticationPrincipal AuthUser user) {
        return courseService.list(user.id());
    }

    @GetMapping("/{id}")
    public CourseResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return courseService.get(user.id(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseResponse create(@AuthenticationPrincipal AuthUser user,
            @Valid @RequestBody CourseRequest request) {
        return courseService.create(user.id(), request);
    }

    @PutMapping("/{id}")
    public CourseResponse update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
            @Valid @RequestBody CourseRequest request) {
        return courseService.update(user.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        courseService.delete(user.id(), id);
    }
}
