import { Component, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Topic } from '../../core/models';
import { TopicsService } from '../../core/topics.service';

export interface TopicDialogData {
  courseId: number;
  topic: Topic | null;
}

@Component({
  selector: 'app-topic-dialog',
  imports: [FormField, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.topic ? 'Edit topic' : 'Add topic' }}</h2>
    <mat-dialog-content>
      <form id="topic-form" (submit)="$event.preventDefault(); onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput [formField]="f.title" />
          @if (f.title().touched() && f.title().invalid()) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Content / lecture notes</mat-label>
          <textarea
            matInput
            rows="12"
            [formField]="f.content"
            placeholder="Paste lecture content or type your notes. The richer this is, the better the AI quizzes, chat answers and mind-maps."
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close type="button">Cancel</button>
      <button matButton="filled" type="submit" form="topic-form" [disabled]="saving()">
        Save
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: min(560px, 85vw);
      padding-top: 8px;
    }
  `,
})
export class TopicDialog {
  private readonly topics = inject(TopicsService);
  private readonly dialogRef = inject(MatDialogRef<TopicDialog>);
  protected readonly data = inject<TopicDialogData>(MAT_DIALOG_DATA);

  protected readonly model = signal({
    title: this.data.topic?.title ?? '',
    content: this.data.topic?.content ?? '',
  });

  protected readonly f = form(this.model, (path) => {
    required(path.title);
  });

  protected readonly saving = signal(false);

  protected async onSubmit(): Promise<void> {
    await submit(this.f, async (field) => {
      this.saving.set(true);
      try {
        const value = field().value();
        const payload = { title: value.title, content: value.content || null };
        const saved = this.data.topic
          ? await this.topics.update(this.data.topic.id, payload)
          : await this.topics.create(this.data.courseId, payload);
        this.dialogRef.close(saved);
      } finally {
        this.saving.set(false);
      }
    });
  }
}
