import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CoursesService } from '../../core/courses.service';
import { LayoutService } from '../../core/layout.service';
import { Course } from '../../core/models';
import { CourseCard } from './course-card';
import { CourseDialog } from './course-dialog';

type SortMode = 'examDate' | 'name';

@Component({
  selector: 'app-dashboard',
  imports: [
    CourseCard,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <header class="dash-header">
      <h1>Your courses</h1>
      <button matButton="filled" (click)="openDialog(null)">
        <mat-icon>add</mat-icon> Add course
      </button>
    </header>

    <div class="dash-controls">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filter-field">
        <mat-label>Filter courses</mat-label>
        <input matInput [value]="filter()" (input)="filter.set($any($event.target).value)" />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <mat-button-toggle-group
        [value]="sort()"
        (change)="sort.set($event.value)"
        aria-label="Sort courses"
      >
        <mat-button-toggle value="examDate">Soonest exam</mat-button-toggle>
        <mat-button-toggle value="name">Name</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    @if (coursesService.courses.isLoading()) {
      <div class="center"><mat-spinner /></div>
    } @else if (visibleCourses().length === 0 && !filter()) {
      <div class="empty-state">
        <mat-icon class="empty-icon">auto_stories</mat-icon>
        <h2>No courses yet</h2>
        <p>Add your first course to start preparing for your exams with AI help.</p>
        <button matButton="filled" (click)="openDialog(null)">
          <mat-icon>add</mat-icon> Add your first course
        </button>
      </div>
    } @else {
      <div class="course-grid" [class.tablet]="layout.isTablet()">
        @for (course of visibleCourses(); track course.id) {
          <app-course-card
            [course]="course"
            (edit)="openDialog($event)"
            (remove)="deleteCourse($event)"
          />
        } @empty {
          <p>No courses match "{{ filter() }}".</p>
        }
      </div>
    }
  `,
  styles: `
    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .dash-header h1 {
      font: var(--mat-sys-headline-medium);
      margin: 8px 0;
    }
    .dash-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin: 8px 0 20px;
    }
    .filter-field {
      flex: 1;
      min-width: 220px;
      max-width: 380px;
    }
    .course-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    /* Tablets get exactly two comfortable columns instead of an awkward squeeze */
    .course-grid.tablet {
      grid-template-columns: repeat(2, 1fr);
    }
    .center {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .empty-state {
      text-align: center;
      padding: 64px 16px;
      color: var(--mat-sys-on-surface-variant);
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
    }
  `,
})
export class DashboardPage {
  protected readonly coursesService = inject(CoursesService);
  protected readonly layout = inject(LayoutService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly filter = signal('');
  protected readonly sort = signal<SortMode>('examDate');

  protected readonly visibleCourses = computed(() => {
    const query = this.filter().trim().toLowerCase();
    const courses = this.coursesService.courses
      .value()
      .filter((c) => !query || c.name.toLowerCase().includes(query));
    if (this.sort() === 'name') {
      return [...courses].sort((a, b) => a.name.localeCompare(b.name));
    }
    // Backend already sorts by exam date; keep null dates last.
    return [...courses].sort((a, b) => {
      if (!a.examDate) return 1;
      if (!b.examDate) return -1;
      return a.examDate.localeCompare(b.examDate);
    });
  });

  protected openDialog(course: Course | null): void {
    this.dialog.open(CourseDialog, { data: course });
  }

  protected async deleteCourse(course: Course): Promise<void> {
    if (!confirm(`Delete "${course.name}" and all its topics, notes and quizzes?`)) {
      return;
    }
    await this.coursesService.delete(course.id);
    this.snackBar.open(`Deleted "${course.name}"`, undefined, { duration: 3000 });
  }
}
