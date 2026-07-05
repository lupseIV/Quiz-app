import { HttpResourceRef } from '@angular/common/http';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { Topic } from '../../core/models';
import { TopicsService } from '../../core/topics.service';
import { TopicDialog, TopicDialogData } from './topic-dialog';

@Component({
  selector: 'app-topics-panel',
  imports: [MatExpansionModule, MatButtonModule, MatIconModule],
  template: `
    <div class="panel-header">
      <p class="hint">
        Topics are the study material the AI uses for quizzes, chat answers and mind-maps.
      </p>
      <button matButton="filled" (click)="openDialog(null)">
        <mat-icon>add</mat-icon> Add topic
      </button>
    </div>

    @if (topicsResource().value().length === 0) {
      <p class="empty">No topics yet. Add your first topic with lecture notes to unlock the AI features.</p>
    } @else {
      <mat-accordion multi>
        @for (topic of topicsResource().value(); track topic.id) {
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title>{{ topic.title }}</mat-panel-title>
            </mat-expansion-panel-header>
            <pre class="topic-content">{{ topic.content || 'No content yet.' }}</pre>
            <mat-action-row>
              <button matButton (click)="openDialog(topic)"><mat-icon>edit</mat-icon> Edit</button>
              <button matButton (click)="deleteTopic(topic)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            </mat-action-row>
          </mat-expansion-panel>
        }
      </mat-accordion>
    }
  `,
  styles: `
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin: 16px 0;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
      margin: 0;
    }
    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 24px 0;
    }
    .topic-content {
      white-space: pre-wrap;
      font-family: inherit;
      margin: 0;
    }
  `,
})
export class TopicsPanel {
  readonly courseId = input.required<number>();
  readonly topicsResource = input.required<HttpResourceRef<Topic[]>>();

  private readonly dialog = inject(MatDialog);
  private readonly topics = inject(TopicsService);

  protected openDialog(topic: Topic | null): void {
    const data: TopicDialogData = { courseId: this.courseId(), topic };
    this.dialog
      .open(TopicDialog, { data })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.topicsResource().reload();
        }
      });
  }

  protected async deleteTopic(topic: Topic): Promise<void> {
    if (!confirm(`Delete topic "${topic.title}"?`)) {
      return;
    }
    await this.topics.delete(topic.id);
    this.topicsResource().reload();
  }
}
