package com.examprep.quiz;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizAttemptIdOrderByIdAsc(Long quizAttemptId);
}
