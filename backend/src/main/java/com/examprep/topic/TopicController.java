package com.examprep.topic;

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
import com.examprep.topic.dto.TopicRequest;
import com.examprep.topic.dto.TopicResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class TopicController {

    private final TopicService topicService;

    public TopicController(TopicService topicService) {
        this.topicService = topicService;
    }

    @GetMapping("/courses/{courseId}/topics")
    public List<TopicResponse> list(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId) {
        return topicService.list(user.id(), courseId);
    }

    @PostMapping("/courses/{courseId}/topics")
    @ResponseStatus(HttpStatus.CREATED)
    public TopicResponse create(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId,
            @Valid @RequestBody TopicRequest request) {
        return topicService.create(user.id(), courseId, request);
    }

    @PutMapping("/topics/{id}")
    public TopicResponse update(@AuthenticationPrincipal AuthUser user, @PathVariable Long id,
            @Valid @RequestBody TopicRequest request) {
        return topicService.update(user.id(), id, request);
    }

    @DeleteMapping("/topics/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        topicService.delete(user.id(), id);
    }
}
