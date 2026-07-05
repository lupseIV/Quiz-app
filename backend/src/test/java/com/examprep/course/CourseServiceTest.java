package com.examprep.course;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.examprep.common.NotFoundException;
import com.examprep.course.dto.CourseRequest;
import com.examprep.course.dto.CourseResponse;
import com.examprep.quiz.QuizAttemptRepository;

class CourseServiceTest {

    private CourseRepository courseRepository;
    private QuizAttemptRepository quizAttemptRepository;
    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseRepository = mock(CourseRepository.class);
        quizAttemptRepository = mock(QuizAttemptRepository.class);
        when(quizAttemptRepository.findFirstByCourseIdAndScoreNotNullOrderByCreatedAtDesc(any()))
            .thenReturn(Optional.empty());
        courseService = new CourseService(courseRepository, quizAttemptRepository);
    }

    @Test
    void listReturnsCoursesSortedByRepository() {
        when(courseRepository.findByUserIdOrderByExamDateAsc(1L)).thenReturn(List.of(
            new Course(1L, "Soonest", LocalDate.of(2026, 7, 10), null),
            new Course(1L, "Later", LocalDate.of(2026, 8, 1), null)));

        List<CourseResponse> courses = courseService.list(1L);

        assertThat(courses).extracting(CourseResponse::name).containsExactly("Soonest", "Later");
    }

    @Test
    void createSavesCourseForUser() {
        when(courseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        CourseResponse response = courseService.create(1L,
            new CourseRequest("Physics", LocalDate.of(2026, 9, 1), "Mechanics"));

        assertThat(response.name()).isEqualTo("Physics");
        assertThat(response.examDate()).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    void getOwnedThrowsNotFoundForForeignCourse() {
        when(courseRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getOwned(1L, 5L))
            .isInstanceOf(NotFoundException.class);
    }

    @Test
    void updateModifiesOwnedCourse() {
        Course course = new Course(1L, "Old", null, null);
        when(courseRepository.findByIdAndUserId(5L, 1L)).thenReturn(Optional.of(course));

        CourseResponse response = courseService.update(1L, 5L,
            new CourseRequest("New", LocalDate.of(2026, 12, 1), "desc"));

        assertThat(response.name()).isEqualTo("New");
        assertThat(course.getName()).isEqualTo("New");
    }
}
