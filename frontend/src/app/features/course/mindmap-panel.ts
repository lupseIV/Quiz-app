import { httpResource } from '@angular/common/http';
import { Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { MindMapService } from '../../core/mindmap.service';
import { MindMap, Topic } from '../../core/models';
import { MindmapView } from './mindmap-view';

@Component({
  selector: 'app-mindmap-panel',
  imports: [
    DatePipe,
    MindmapView,
    MatButtonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="generate-row">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="topic-select">
        <mat-label>Scope</mat-label>
        <mat-select [value]="scopeTopicId()" (selectionChange)="scopeTopicId.set($event.value)">
          <mat-option [value]="null">Whole course</mat-option>
          @for (topic of topics(); track topic.id) {
            <mat-option [value]="topic.id">{{ topic.title }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <button matButton="filled" (click)="generate()" [disabled]="generating()">
        <mat-icon>account_tree</mat-icon> Generate visual map
      </button>
    </div>
    <p class="hint">
      Colorful mind-maps with a catchy phrase per node — built for visual learners.
      Saved maps stay here so you can revisit them, or regenerate for a fresh take.
    </p>

    @if (generating()) {
      <div class="center">
        <mat-spinner />
        <p>Sketching your mind-map…</p>
      </div>
    }
    @if (error()) {
      <p class="error-text">{{ error() }}</p>
    }

    @for (map of maps.value(); track map.id) {
      <mat-expansion-panel [expanded]="$first" class="map-panel">
        <mat-expansion-panel-header>
          <mat-panel-title>{{ map.title }}</mat-panel-title>
          <mat-panel-description>{{ map.createdAt | date: 'medium' }}</mat-panel-description>
        </mat-expansion-panel-header>
        <app-mindmap-view [root]="map.nodes.root" />
        <mat-action-row>
          <button matButton (click)="deleteMap(map)"><mat-icon>delete</mat-icon> Delete</button>
        </mat-action-row>
      </mat-expansion-panel>
    } @empty {
      @if (!generating()) {
        <p class="hint">No mind-maps yet.</p>
      }
    }
  `,
  styles: `
    .generate-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin: 16px 0 4px;
    }
    .topic-select {
      min-width: 220px;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
    }
    .center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
    }
    .error-text {
      color: var(--mat-sys-error);
    }
    .map-panel {
      margin: 12px 0;
    }
  `,
})
export class MindmapPanel {
  readonly courseId = input.required<number>();
  readonly topics = input.required<Topic[]>();

  private readonly mindMapService = inject(MindMapService);

  protected readonly scopeTopicId = signal<number | null>(null);
  protected readonly generating = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly maps = httpResource<MindMap[]>(
    () => `/api/courses/${this.courseId()}/mindmap`,
    { defaultValue: [] },
  );

  protected async generate(): Promise<void> {
    this.generating.set(true);
    this.error.set(null);
    try {
      await this.mindMapService.generate(this.courseId(), this.scopeTopicId());
      this.maps.reload();
    } catch (err: unknown) {
      const httpError = err as { error?: { message?: string } };
      this.error.set(httpError?.error?.message ?? 'Mind-map generation failed. Try again.');
    } finally {
      this.generating.set(false);
    }
  }

  protected async deleteMap(map: MindMap): Promise<void> {
    if (!confirm(`Delete mind-map "${map.title}"?`)) {
      return;
    }
    await this.mindMapService.delete(map.id);
    this.maps.reload();
  }
}
