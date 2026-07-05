import { httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Note, Topic } from '../../core/models';
import { NotesService } from '../../core/notes.service';
import { DrawingCanvas } from './drawing-canvas';

@Component({
  selector: 'app-notes-panel',
  imports: [
    DatePipe,
    DrawingCanvas,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="mode-row">
      <mat-button-toggle-group
        [value]="mode()"
        (change)="mode.set($event.value)"
        aria-label="Note input mode"
      >
        <mat-button-toggle value="keyboard"><mat-icon>keyboard</mat-icon> Keyboard</mat-button-toggle>
        <mat-button-toggle value="drawing"><mat-icon>stylus_note</mat-icon> Handwriting</mat-button-toggle>
      </mat-button-toggle-group>

      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="topic-select">
        <mat-label>Attach to topic (optional)</mat-label>
        <mat-select [value]="selectedTopicId()" (selectionChange)="selectedTopicId.set($event.value)">
          <mat-option [value]="null">Whole course</mat-option>
          @for (topic of topics(); track topic.id) {
            <mat-option [value]="topic.id">{{ topic.title }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @switch (mode()) {
      @case ('keyboard') {
        <mat-form-field appearance="outline" class="text-editor">
          <mat-label>Type a note</mat-label>
          <textarea
            matInput
            rows="6"
            [value]="draft()"
            (input)="draft.set($any($event.target).value)"
            placeholder="Formulas, reminders, summaries…"
          ></textarea>
        </mat-form-field>
        <button matButton="filled" (click)="saveText()" [disabled]="!draft().trim() || saving()">
          <mat-icon>save</mat-icon> Save note
        </button>
      }
      @case ('drawing') {
        <app-drawing-canvas (saved)="saveDrawing($event)" />
      }
    }

    <h3 class="notes-title">Saved notes</h3>
    @if (notes.value().length === 0) {
      <p class="empty">No notes yet — typed notes and handwritten sketches will show up here together.</p>
    } @else {
      <div class="notes-grid">
        @for (note of notes.value(); track note.id) {
          <mat-card appearance="outlined">
            <mat-card-content>
              @if (note.type === 'TEXT') {
                <p class="note-text">{{ note.textContent }}</p>
              } @else {
                <img [src]="note.imageData" alt="Handwritten note" class="note-image" />
              }
            </mat-card-content>
            <mat-card-footer class="note-footer">
              <span>
                {{ note.createdAt | date: 'medium' }}
                @if (topicTitle(note); as title) {
                  · {{ title }}
                }
              </span>
              <button matIconButton (click)="deleteNote(note)" aria-label="Delete note">
                <mat-icon>delete</mat-icon>
              </button>
            </mat-card-footer>
          </mat-card>
        }
      </div>
    }
  `,
  styles: `
    .mode-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin: 16px 0;
    }
    .topic-select {
      min-width: 220px;
    }
    .text-editor {
      display: block;
    }
    .notes-title {
      font: var(--mat-sys-title-medium);
      margin: 24px 0 12px;
    }
    .empty {
      color: var(--mat-sys-on-surface-variant);
    }
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }
    .note-text {
      white-space: pre-wrap;
      margin: 0;
    }
    .note-image {
      width: 100%;
      border-radius: 4px;
    }
    .note-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px 8px;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
    }
  `,
})
export class NotesPanel {
  readonly courseId = input.required<number>();
  readonly topics = input.required<Topic[]>();

  private readonly notesService = inject(NotesService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly mode = signal<'keyboard' | 'drawing'>('keyboard');
  protected readonly draft = signal('');
  protected readonly selectedTopicId = signal<number | null>(null);
  protected readonly saving = signal(false);

  protected readonly notes = httpResource<Note[]>(
    () => `/api/courses/${this.courseId()}/notes`,
    { defaultValue: [] },
  );

  protected topicTitle(note: Note): string | null {
    if (note.topicId == null) {
      return null;
    }
    return this.topics().find((t) => t.id === note.topicId)?.title ?? null;
  }

  protected async saveText(): Promise<void> {
    this.saving.set(true);
    try {
      await this.notesService.create(this.courseId(), {
        topicId: this.selectedTopicId(),
        type: 'TEXT',
        textContent: this.draft().trim(),
        imageData: null,
      });
      this.draft.set('');
      this.notes.reload();
    } finally {
      this.saving.set(false);
    }
  }

  protected async saveDrawing(imageData: string): Promise<void> {
    await this.notesService.create(this.courseId(), {
      topicId: this.selectedTopicId(),
      type: 'DRAWING',
      textContent: null,
      imageData,
    });
    this.notes.reload();
    this.snackBar.open('Drawing saved', undefined, { duration: 2500 });
  }

  protected async deleteNote(note: Note): Promise<void> {
    if (!confirm('Delete this note?')) {
      return;
    }
    await this.notesService.delete(note.id);
    this.notes.reload();
  }
}
