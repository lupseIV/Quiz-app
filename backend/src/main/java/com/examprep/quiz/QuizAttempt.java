package com.examprep.quiz;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long courseId;

    /** Null until the quiz is submitted. */
    private Integer score;

    @Column(nullable = false)
    private int totalQuestions;

    @Column(nullable = false)
    private Instant createdAt;

    protected QuizAttempt() {
    }

    public QuizAttempt(Long courseId, int totalQuestions) {
        this.courseId = courseId;
        this.totalQuestions = totalQuestions;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public Integer getScore() {
        return score;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isSubmitted() {
        return score != null;
    }

    public void setScore(int score) {
        this.score = score;
    }
}
