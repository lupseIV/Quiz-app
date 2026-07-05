package com.examprep.quiz;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    Optional<QuizAttempt> findFirstByCourseIdAndScoreNotNullOrderByCreatedAtDesc(Long courseId);
}
