package com.examprep.chat;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.examprep.chat.dto.ChatDtos.ChatMessageResponse;
import com.examprep.chat.dto.ChatDtos.ChatRequest;
import com.examprep.config.AuthUser;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses/{courseId}/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatMessageResponse send(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId,
            @Valid @RequestBody ChatRequest request) {
        return chatService.send(user.id(), courseId, request.message());
    }

    @GetMapping("/history")
    public List<ChatMessageResponse> history(@AuthenticationPrincipal AuthUser user,
            @PathVariable Long courseId) {
        return chatService.history(user.id(), courseId);
    }
}
