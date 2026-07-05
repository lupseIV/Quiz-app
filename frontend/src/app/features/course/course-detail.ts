import { httpResource } from '@angular/common/http';
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { Course, Topic } from '../../core/models';
import { ChatPanel } from './chat-panel';
import { MindmapPanel } from './mindmap-panel';
import { NotesPanel } from './notes-panel';
import { QuizPanel } from './quiz-panel';
import { TopicsPanel } from './topics-panel';

const TABS = ['topics', 'notes', 'quiz', 'chat', 'mindmap'] as const;

@Component({
  selector: 'app-course-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TopicsPanel,
    NotesPanel,
    QuizPanel,
    ChatPanel,
    MindmapPanel,
  ],
  template: `
    <a matButton routerLink="/dashboard"><mat-icon>arrow_back</mat-icon> Dashboard</a>

    @if (course.isLoading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (course.value(); as c) {
      <header class="course-header">
        <h1>{{ c.name }}</h1>
        @if (c.examDate) {
          <p class="exam-line">Exam on {{ c.examDate | date: 'fullDate' }}</p>
        }
        @if (c.description) {
          <p>{{ c.description }}</p>
        }
      </header>

      <mat-tab-group
        [selectedIndex]="selectedTab()"
        (selectedIndexChange)="onTabChange($event)"
        dynamicHeight
      >
        <mat-tab label="Topics">
          <app-topics-panel [courseId]="courseId()" [topicsResource]="topics" />
        </mat-tab>
        <mat-tab label="Notes">
          <app-notes-panel [courseId]="courseId()" [topics]="topics.value()" />
        </mat-tab>
        <mat-tab label="Quiz">
          <app-quiz-panel [courseId]="courseId()" [autoGenerate]="autoGenerate()" />
        </mat-tab>
        <mat-tab label="AI Chat">
          <app-chat-panel [courseId]="courseId()" />
        </mat-tab>
        <mat-tab label="Mind-maps">
          <app-mindmap-panel [courseId]="courseId()" [topics]="topics.value()" />
        </mat-tab>
      </mat-tab-group>
    } @else if (course.error()) {
      <p>Course not found.</p>
    }
  `,
  styles: `
    .course-header h1 {
      font: var(--mat-sys-headline-medium);
      margin: 12px 0 4px;
    }
    .exam-line {
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 4px;
    }
    .center {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    mat-tab-group {
      margin-top: 8px;
    }
  `,
})
export class CourseDetailPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Bound from the :courseId route param via withComponentInputBinding(). */
  readonly courseId = input.required({ transform: numberAttribute });

  private readonly tabParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('tab'))),
    { initialValue: null },
  );
  private readonly generateParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('generate'))),
    { initialValue: null },
  );

  protected readonly selectedTab = computed(() => {
    const index = TABS.indexOf((this.tabParam() ?? 'topics') as (typeof TABS)[number]);
    return index === -1 ? 0 : index;
  });
  protected readonly autoGenerate = computed(() => this.generateParam() === '1');

  readonly course = httpResource<Course>(() => `/api/courses/${this.courseId()}`);
  readonly topics = httpResource<Topic[]>(() => `/api/courses/${this.courseId()}/topics`, {
    defaultValue: [],
  });

  protected onTabChange(index: number): void {
    this.router.navigate([], {
      queryParams: { tab: TABS[index], generate: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
