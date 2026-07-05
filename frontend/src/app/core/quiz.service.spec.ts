import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { QuizService } from './quiz.service';

describe('QuizService', () => {
  let service: QuizService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(QuizService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('generate posts to the course quiz endpoint', async () => {
    const generatePromise = service.generate(7);
    const req = httpMock.expectOne('/api/courses/7/quiz/generate');
    expect(req.request.method).toBe('POST');
    req.flush({
      quizId: 42,
      questions: [{ id: 1, questionText: 'Q?', options: ['A', 'B', 'C', 'D'] }],
    });

    const quiz = await generatePromise;
    expect(quiz.quizId).toBe(42);
    expect(quiz.questions).toHaveLength(1);
  });

  it('submit sends answers keyed by question id', async () => {
    const submitPromise = service.submit(7, 42, [{ questionId: 1, answer: 'A' }]);
    const req = httpMock.expectOne('/api/courses/7/quiz/42/submit');
    expect(req.request.body).toEqual({ answers: [{ questionId: 1, answer: 'A' }] });
    req.flush({
      quizId: 42,
      score: 1,
      totalQuestions: 1,
      questions: [
        {
          id: 1,
          questionText: 'Q?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswer: 'A',
          userAnswer: 'A',
          correct: true,
        },
      ],
    });

    const result = await submitPromise;
    expect(result.score).toBe(1);
    expect(result.questions[0].correct).toBe(true);
  });
});
