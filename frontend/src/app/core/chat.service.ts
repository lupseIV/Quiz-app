import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ChatMessage } from './models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  send(courseId: number, message: string): Promise<ChatMessage> {
    return firstValueFrom(
      this.http.post<ChatMessage>(`/api/courses/${courseId}/chat`, { message }),
    );
  }
}
