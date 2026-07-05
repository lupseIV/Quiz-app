package com.examprep.chat;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCourseIdOrderByCreatedAtAsc(Long courseId);
}
