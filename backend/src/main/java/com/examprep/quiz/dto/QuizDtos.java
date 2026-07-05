package com.examprep.quiz.dto;

import java.time.Instant;
import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

/** All quiz-related DTOs, grouped because they are small and always used together. */
public final class QuizDtos {

    private QuizDtos() {
    }

    /** A question as shown to the student while taking the quiz — no correct answer leaked. */
    public record QuestionView(Long id, String questionText, List<String> options) {
    }

    /** A freshly generated, not-yet-submitted quiz. */
    public record GeneratedQuiz(Long quizId, List<QuestionView> questions) {
    }

    public record AnswerSubmission(@NotNull Long questionId, String answer) {
    }

    public record QuizSubmission(@NotEmpty List<AnswerSubmission> answers) {
    }

    /** Per-question result revealed after submission. */
    public record QuestionResult(Long id, String questionText, List<String> options,
            String correctAnswer, String userAnswer, boolean correct) {
    }

    public record QuizResult(Long quizId, int score, int totalQuestions, List<QuestionResult> questions) {
    }

    public record AttemptSummary(Long id, Integer score, int totalQuestions, Instant createdAt) {
    }
}
