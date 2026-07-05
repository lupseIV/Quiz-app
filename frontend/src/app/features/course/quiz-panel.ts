import { httpResource } from '@angular/common/http';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { GeneratedQuiz, QuizAttemptSummary, QuizResult } from '../../core/models';
import { QuizService } from '../../core/quiz.service';

@Component({
  selector: 'app-quiz-panel',
  imports: [
    DatePipe,
    FormField,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (generating()) {
      <div class="center">
        <mat-spinner />
        <p>Claude is writing your quiz…</p>
      </div>
    } @else if (result(); as r) {
      <section class="result-header">
        <h2>You scored {{ r.score }}/{{ r.totalQuestions }}</h2>
        <button matButton="filled" (click)="reset()">Back to quiz overview</button>
      </section>
      @for (q of r.questions; track q.id; let i = $index) {
        <mat-card appearance="outlined" class="question-card" [class.wrong]="!q.correct">
          <mat-card-content>
            <p class="question-text">{{ i + 1 }}. {{ q.questionText }}</p>
            @for (option of q.options; track option) {
              <p
                class="option"
                [class.correct-option]="option === q.correctAnswer"
                [class.picked-wrong]="option === q.userAnswer && !q.correct"
              >
                @if (option === q.correctAnswer) {
                  <mat-icon inline>check_circle</mat-icon>
                } @else if (option === q.userAnswer) {
                  <mat-icon inline>cancel</mat-icon>
                }
                {{ option }}
              </p>
            }
          </mat-card-content>
        </mat-card>
      }
    } @else if (quiz(); as activeQuiz) {
      <form (submit)="$event.preventDefault(); submitQuiz()">
        @for (q of activeQuiz.questions; track q.id; let i = $index) {
          <mat-card appearance="outlined" class="question-card">
            <mat-card-content>
              <p class="question-text">{{ i + 1 }}. {{ q.questionText }}</p>
              @for (option of q.options; track option) {
                <label class="option radio-option">
                  <!-- Signal Forms assigns the radio group name itself from the bound field -->
                  <input type="radio" [value]="option" [formField]="answersForm.answers[i]" />
                  {{ option }}
                </label>
              }
            </mat-card-content>
          </mat-card>
        }
        <div class="submit-row">
          <button matButton="filled" type="submit" [disabled]="!allAnswered() || submitting()">
            Submit answers
          </button>
          @if (!allAnswered()) {
            <span class="hint">Answer all {{ activeQuiz.questions.length }} questions to submit.</span>
          }
        </div>
      </form>
    } @else {
      <div class="overview">
        <button matButton="filled" (click)="generate()">
          <mat-icon>bolt</mat-icon> Generate quiz from my topics
        </button>
        @if (error()) {
          <p class="error-text">{{ error() }}</p>
        }

        <h3>Quiz history</h3>
        @if (attempts.value().length === 0) {
          <p class="hint">No quizzes yet. Generate one to test yourself.</p>
        } @else {
          <mat-list>
            @for (attempt of attempts.value(); track attempt.id) {
              <mat-list-item>
                <mat-icon matListItemIcon>
                  {{ scoreIcon(attempt) }}
                </mat-icon>
                <span matListItemTitle>
                  @if (attempt.score !== null) {
                    Score {{ attempt.score }}/{{ attempt.totalQuestions }}
                  } @else {
                    Not submitted
                  }
                </span>
                <span matListItemLine>{{ attempt.createdAt | date: 'medium' }}</span>
              </mat-list-item>
            }
          </mat-list>
        }
      </div>
    }
  `,
  styles: `
    .center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px;
    }
    .overview {
      padding: 16px 0;
    }
    .overview h3 {
      font: var(--mat-sys-title-medium);
      margin: 24px 0 8px;
    }
    .question-card {
      margin: 12px 0;
    }
    .question-card.wrong {
      border-color: var(--mat-sys-error);
    }
    .question-text {
      font: var(--mat-sys-title-small);
    }
    .option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
    }
    .radio-option {
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 6px;
    }
    .radio-option:hover {
      background: var(--mat-sys-surface-container-high);
    }
    .correct-option {
      color: var(--mat-sys-primary);
      font-weight: 600;
    }
    .picked-wrong {
      color: var(--mat-sys-error);
    }
    .submit-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
    }
    .error-text {
      color: var(--mat-sys-error);
    }
  `,
})
export class QuizPanel {
  readonly courseId = input.required<number>();
  readonly autoGenerate = input(false);

  private readonly quizService = inject(QuizService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly quiz = signal<GeneratedQuiz | null>(null);
  protected readonly result = signal<QuizResult | null>(null);
  protected readonly generating = signal(false);
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  /** Signal Form over the answer array; one entry per question. */
  protected readonly answersModel = signal<{ answers: string[] }>({ answers: [] });
  protected readonly answersForm = form(this.answersModel);

  protected readonly allAnswered = computed(() => {
    const quiz = this.quiz();
    const answers = this.answersModel().answers;
    return quiz !== null && answers.length === quiz.questions.length && answers.every((a) => !!a);
  });

  protected readonly attempts = httpResource<QuizAttemptSummary[]>(
    () => `/api/courses/${this.courseId()}/quiz/attempts`,
    { defaultValue: [] },
  );

  private readonly autoGenerateOnce = effect(() => {
    if (this.autoGenerate() && !this.quiz() && !this.generating() && !this.result()) {
      this.generate();
    }
  });

  protected async generate(): Promise<void> {
    this.generating.set(true);
    this.error.set(null);
    try {
      const quiz = await this.quizService.generate(this.courseId());
      this.answersModel.set({ answers: quiz.questions.map(() => '') });
      this.quiz.set(quiz);
    } catch (err: unknown) {
      const httpError = err as { error?: { message?: string } };
      this.error.set(httpError?.error?.message ?? 'Quiz generation failed. Try again.');
    } finally {
      this.generating.set(false);
    }
  }

  protected async submitQuiz(): Promise<void> {
    const quiz = this.quiz();
    if (!quiz) {
      return;
    }
    this.submitting.set(true);
    try {
      const answers = quiz.questions.map((q, i) => ({
        questionId: q.id,
        answer: this.answersModel().answers[i] || null,
      }));
      const result = await this.quizService.submit(this.courseId(), quiz.quizId, answers);
      this.result.set(result);
      this.quiz.set(null);
      this.attempts.reload();
      this.snackBar.open(`Scored ${result.score}/${result.totalQuestions}`, undefined, {
        duration: 3000,
      });
    } finally {
      this.submitting.set(false);
    }
  }

  protected reset(): void {
    this.result.set(null);
    this.quiz.set(null);
  }

  protected scoreIcon(attempt: QuizAttemptSummary): string {
    if (attempt.score === null) {
      return 'hourglass_empty';
    }
    const ratio = attempt.score / attempt.totalQuestions;
    return ratio >= 0.8 ? 'military_tech' : ratio >= 0.5 ? 'thumb_up' : 'menu_book';
  }
}
