package com.examprep.course.dto;

import java.time.LocalDate;

import com.examprep.course.Course;

public record CourseResponse(Long id, String name, LocalDate examDate, String description,
        Integer lastScore, Integer lastTotal) {

    public static CourseResponse from(Course course) {
        return from(course, null, null);
    }

    public static CourseResponse from(Course course, Integer lastScore, Integer lastTotal) {
        return new CourseResponse(course.getId(), course.getName(), course.getExamDate(),
            course.getDescription(), lastScore, lastTotal);
    }
}
