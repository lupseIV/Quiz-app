package com.examprep.course.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CourseRequest(
    @NotBlank @Size(max = 200) String name,
    LocalDate examDate,
    @Size(max = 2000) String description) {
}
