package com.examprep.course;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    private LocalDate examDate;

    @Column(length = 2000)
    private String description;

    protected Course() {
    }

    public Course(Long userId, String name, LocalDate examDate, String description) {
        this.userId = userId;
        this.name = name;
        this.examDate = examDate;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public LocalDate getExamDate() {
        return examDate;
    }

    public String getDescription() {
        return description;
    }

    public void update(String name, LocalDate examDate, String description) {
        this.name = name;
        this.examDate = examDate;
        this.description = description;
    }
}
