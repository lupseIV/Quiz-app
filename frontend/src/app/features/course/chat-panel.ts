import { httpResource } from '@angular/common/http';
import { Component, effect, inject, input, signal, viewChild, ElementRef } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChatService } from '../../core/chat.service';
import { ChatMessage } from '../../core/models';

@Component({
  selector: 'app-chat-panel',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="chat-log" #chatLog>
      @if (history.value().length === 0 && pending().length === 0) {
        <p class="hint">
          Ask anything about this course's material — "explain X differently",
          "give me a mnemonic for Y", "quiz me on Z".
        </p>
      }
      @for (message of allMessages(); track message.id) {
        <div class="bubble" [class.user]="message.role === 'user'">
          <p>{{ message.content }}</p>
        </div>
      }
      @if (waiting()) {
        <div class="bubble assistant-typing"><mat-spinner diameter="20" /></div>
      }
    </div>

    <form class="chat-input" (submit)="$event.preventDefault(); send()">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="chat-field">
        <mat-label>Ask about this course</mat-label>
        <input
          matInput
          [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          [disabled]="waiting()"
        />
      </mat-form-field>
      <button
        matIconButton
        type="submit"
        [disabled]="!draft().trim() || waiting()"
        aria-label="Send message"
      >
        <mat-icon>send</mat-icon>
      </button>
    </form>
  `,
  styles: `
    .chat-log {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 240px;
      max-height: 55vh;
      overflow-y: auto;
      padding: 16px 4px;
    }
    .bubble {
      max-width: min(600px, 85%);
      padding: 10px 14px;
      border-radius: 16px;
      background: var(--mat-sys-surface-container-high);
      align-self: flex-start;
      white-space: pre-wrap;
    }
    .bubble p {
      margin: 0;
    }
    .bubble.user {
      align-self: flex-end;
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }
    .assistant-typing {
      padding: 10px;
    }
    .chat-input {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 16px;
    }
    .chat-field {
      flex: 1;
    }
    .hint {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class ChatPanel {
  readonly courseId = input.required<number>();

  private readonly chatService = inject(ChatService);
  private readonly chatLog = viewChild<ElementRef<HTMLDivElement>>('chatLog');

  protected readonly draft = signal('');
  protected readonly waiting = signal(false);
  /** Messages sent/received since the last history load, shown optimistically. */
  protected readonly pending = signal<ChatMessage[]>([]);

  protected readonly history = httpResource<ChatMessage[]>(
    () => `/api/courses/${this.courseId()}/chat/history`,
    { defaultValue: [] },
  );

  protected allMessages(): ChatMessage[] {
    return [...this.history.value(), ...this.pending()];
  }

  private readonly scrollOnChange = effect(() => {
    this.history.value();
    this.pending();
    queueMicrotask(() => {
      const el = this.chatLog()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  });

  protected async send(): Promise<void> {
    const message = this.draft().trim();
    if (!message) {
      return;
    }
    this.draft.set('');
    this.waiting.set(true);
    this.pending.update((p) => [
      ...p,
      { id: -Date.now(), role: 'user', content: message, createdAt: new Date().toISOString() },
    ]);
    try {
      const reply = await this.chatService.send(this.courseId(), message);
      this.pending.update((p) => [...p, reply]);
    } catch {
      this.pending.update((p) => [
        ...p,
        {
          id: -Date.now() - 1,
          role: 'assistant',
          content: 'Sorry — that failed. Check the backend logs / your rate limit and try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      this.waiting.set(false);
    }
  }
}
