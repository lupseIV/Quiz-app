package com.examprep.quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "quiz_questions")
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long quizAttemptId;

    @Column(nullable = false, columnDefinition = "text")
    private String questionText;

    /** JSON array of option strings, e.g. ["A", "B", "C", "D"]. */
    @Column(nullable = false, columnDefinition = "text")
    private String optionsJson;

    @Column(nullable = false)
    private String correctAnswer;

    private String userAnswer;

    protected QuizQuestion() {
    }

    public QuizQuestion(Long quizAttemptId, String questionText, String optionsJson, String correctAnswer) {
        this.quizAttemptId = quizAttemptId;
        this.questionText = questionText;
        this.optionsJson = optionsJson;
        this.correctAnswer = correctAnswer;
    }

    public Long getId() {
        return id;
    }

    public Long getQuizAttemptId() {
        return quizAttemptId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public String getOptionsJson() {
        return optionsJson;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public String getUserAnswer() {
        return userAnswer;
    }

    public void setUserAnswer(String userAnswer) {
        this.userAnswer = userAnswer;
    }

    public boolean isCorrect() {
        return correctAnswer.equals(userAnswer);
    }
}
