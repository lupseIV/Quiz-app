import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { CoursePayload, CoursesService } from '../../core/courses.service';
import { Course } from '../../core/models';

@Component({
  selector: 'app-course-dialog',
  imports: [FormField, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Edit course' : 'Add course' }}</h2>
    <mat-dialog-content>
      <form id="course-form" (submit)="$event.preventDefault(); onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Course name</mat-label>
          <input matInput [formField]="f.name" />
          @if (f.name().touched() && f.name().invalid()) {
            <mat-error>Name is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Exam date</mat-label>
          <input matInput type="date" [formField]="f.examDate" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Short description</mat-label>
          <textarea matInput rows="3" [formField]="f.description"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close type="button">Cancel</button>
      <button matButton="filled" type="submit" form="course-form" [disabled]="saving()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: min(400px, 80vw);
      padding-top: 8px;
    }
  `,
})
export class CourseDialog {
  private readonly courses = inject(CoursesService);
  private readonly dialogRef = inject(MatDialogRef<CourseDialog>);
  protected readonly data = inject<Course | null>(MAT_DIALOG_DATA);

  protected readonly model = signal({
    name: this.data?.name ?? '',
    examDate: this.data?.examDate ?? '',
    description: this.data?.description ?? '',
  });

  protected readonly f = form(this.model, (path) => {
    required(path.name);
  });

  protected readonly saving = signal(false);

  protected async onSubmit(): Promise<void> {
    await submit(this.f, async (field) => {
      this.saving.set(true);
      try {
        const value = field().value();
        const payload: CoursePayload = {
          name: value.name,
          examDate: value.examDate || null,
          description: value.description || null,
        };
        const saved = this.data
          ? await this.courses.update(this.data.id, payload)
          : await this.courses.create(payload);
        this.dialogRef.close(saved);
      } finally {
        this.saving.set(false);
      }
    });
  }
}
