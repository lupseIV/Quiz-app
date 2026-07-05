import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { GeneratedQuiz, QuizResult } from './models';

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly http = inject(HttpClient);

  generate(courseId: number): Promise<GeneratedQuiz> {
    return firstValueFrom(
      this.http.post<GeneratedQuiz>(`/api/courses/${courseId}/quiz/generate`, {}),
    );
  }

  submit(
    courseId: number,
    quizId: number,
    answers: { questionId: number; answer: string | null }[],
  ): Promise<QuizResult> {
    return firstValueFrom(
      this.http.post<QuizResult>(`/api/courses/${courseId}/quiz/${quizId}/submit`, { answers }),
    );
  }
}
