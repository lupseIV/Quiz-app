import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';

import { Course } from '../../core/models';

@Component({
  selector: 'app-course-card',
  imports: [DatePipe, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>
          <a [routerLink]="['/courses', course().id]">{{ course().name }}</a>
        </mat-card-title>
        <mat-card-subtitle>
          @if (course().examDate) {
            {{ course().examDate | date: 'mediumDate' }} —
            <span [class.urgent]="isUrgent()">{{ countdown() }}</span>
          } @else {
            No exam date set
          }
        </mat-card-subtitle>
        <span class="header-spacer"></span>
        <button
          matIconButton
          [matMenuTriggerFor]="menu"
          aria-label="Course actions"
          class="card-menu"
        >
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu>
          <button mat-menu-item (click)="edit.emit(course())">
            <mat-icon>edit</mat-icon> Edit
          </button>
          <button mat-menu-item (click)="remove.emit(course())">
            <mat-icon>delete</mat-icon> Delete
          </button>
        </mat-menu>
      </mat-card-header>
      <mat-card-content>
        @if (course().description) {
          <p>{{ course().description }}</p>
        }
        @if (course().lastScore != null) {
          <p class="last-score">
            <mat-icon inline>quiz</mat-icon>
            Last quiz: {{ course().lastScore }}/{{ course().lastTotal }}
          </p>
        }
      </mat-card-content>
      <mat-card-actions>
        <a matButton [routerLink]="['/courses', course().id]">Open</a>
        <a
          matButton="tonal"
          [routerLink]="['/courses', course().id]"
          [queryParams]="{ tab: 'quiz', generate: 1 }"
        >
          <mat-icon>bolt</mat-icon> Generate quiz
        </a>
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    mat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    mat-card-content {
      flex: 1;
    }
    mat-card-header {
      align-items: flex-start;
    }
    .header-spacer {
      flex: 1;
    }
    mat-card-title a {
      color: inherit;
      text-decoration: none;
    }
    .urgent {
      color: var(--mat-sys-error);
      font-weight: 600;
    }
    .last-score {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class CourseCard {
  readonly course = input.required<Course>();
  readonly edit = output<Course>();
  readonly remove = output<Course>();

  /** "Exam in 12 days" derived reactively from the exam date. */
  protected readonly daysLeft = computed(() => {
    const examDate = this.course().examDate;
    if (!examDate) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exam = new Date(examDate + 'T00:00:00');
    return Math.round((exam.getTime() - today.getTime()) / 86_400_000);
  });

  protected readonly countdown = computed(() => {
    const days = this.daysLeft();
    if (days === null) {
      return '';
    }
    if (days < 0) {
      return `Exam was ${-days} day${days === -1 ? '' : 's'} ago`;
    }
    if (days === 0) {
      return 'Exam is today!';
    }
    return `Exam in ${days} day${days === 1 ? '' : 's'}`;
  });

  protected readonly isUrgent = computed(() => {
    const days = this.daysLeft();
    return days !== null && days >= 0 && days <= 7;
  });
}
