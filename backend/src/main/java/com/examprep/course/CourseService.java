package com.examprep.course;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.examprep.common.NotFoundException;
import com.examprep.course.dto.CourseRequest;
import com.examprep.course.dto.CourseResponse;
import com.examprep.quiz.QuizAttemptRepository;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public CourseService(CourseRepository courseRepository,
            QuizAttemptRepository quizAttemptRepository) {
        this.courseRepository = courseRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    public List<CourseResponse> list(Long userId) {
        return courseRepository.findByUserIdOrderByExamDateAsc(userId).stream()
            .map(course -> quizAttemptRepository
                .findFirstByCourseIdAndScoreNotNullOrderByCreatedAtDesc(course.getId())
                .map(a -> CourseResponse.from(course, a.getScore(), a.getTotalQuestions()))
                .orElseGet(() -> CourseResponse.from(course)))
            .toList();
    }

    public CourseResponse get(Long userId, Long courseId) {
        return CourseResponse.from(getOwned(userId, courseId));
    }

    public CourseResponse create(Long userId, CourseRequest request) {
        Course course = new Course(userId, request.name(), request.examDate(), request.description());
        return CourseResponse.from(courseRepository.save(course));
    }

    @Transactional
    public CourseResponse update(Long userId, Long courseId, CourseRequest request) {
        Course course = getOwned(userId, courseId);
        course.update(request.name(), request.examDate(), request.description());
        return CourseResponse.from(course);
    }

    public void delete(Long userId, Long courseId) {
        courseRepository.delete(getOwned(userId, courseId));
    }

    /** Loads a course and verifies it belongs to the given user, else 404. */
    public Course getOwned(Long userId, Long courseId) {
        return courseRepository.findByIdAndUserId(courseId, userId)
            .orElseThrow(() -> new NotFoundException("Course " + courseId + " not found"));
    }
}
