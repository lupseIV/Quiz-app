package com.examprep.mindmap;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.examprep.config.AuthUser;
import com.examprep.mindmap.dto.MindMapDtos.GenerateRequest;
import com.examprep.mindmap.dto.MindMapDtos.MindMapResponse;

@RestController
@RequestMapping("/api")
public class MindMapController {

    private final MindMapService mindMapService;

    public MindMapController(MindMapService mindMapService) {
        this.mindMapService = mindMapService;
    }

    @PostMapping("/courses/{courseId}/mindmap/generate")
    public MindMapResponse generate(@AuthenticationPrincipal AuthUser user,
            @PathVariable Long courseId, @RequestBody(required = false) GenerateRequest request) {
        Long topicId = request != null ? request.topicId() : null;
        return mindMapService.generate(user.id(), courseId, topicId);
    }

    @GetMapping("/courses/{courseId}/mindmap")
    public List<MindMapResponse> list(@AuthenticationPrincipal AuthUser user,
            @PathVariable Long courseId) {
        return mindMapService.list(user.id(), courseId);
    }

    @DeleteMapping("/mindmaps/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        mindMapService.delete(user.id(), id);
    }
}
