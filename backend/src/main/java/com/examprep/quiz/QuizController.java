package com.examprep.quiz;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.examprep.config.AuthUser;
import com.examprep.quiz.dto.QuizDtos.AttemptSummary;
import com.examprep.quiz.dto.QuizDtos.GeneratedQuiz;
import com.examprep.quiz.dto.QuizDtos.QuizResult;
import com.examprep.quiz.dto.QuizDtos.QuizSubmission;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/courses/{courseId}/quiz")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @PostMapping("/generate")
    public GeneratedQuiz generate(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId) {
        return quizService.generate(user.id(), courseId);
    }

    @PostMapping("/{quizId}/submit")
    public QuizResult submit(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId,
            @PathVariable Long quizId, @Valid @RequestBody QuizSubmission submission) {
        return quizService.submit(user.id(), courseId, quizId, submission);
    }

    @GetMapping("/attempts")
    public List<AttemptSummary> history(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId) {
        return quizService.history(user.id(), courseId);
    }

    @GetMapping("/{quizId}/result")
    public QuizResult result(@AuthenticationPrincipal AuthUser user, @PathVariable Long courseId,
            @PathVariable Long quizId) {
        return quizService.getResult(user.id(), courseId, quizId);
    }
}
