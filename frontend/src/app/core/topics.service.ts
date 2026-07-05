import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Topic } from './models';

export interface TopicPayload {
  title: string;
  content: string | null;
}

@Injectable({ providedIn: 'root' })
export class TopicsService {
  private readonly http = inject(HttpClient);

  create(courseId: number, payload: TopicPayload): Promise<Topic> {
    return firstValueFrom(this.http.post<Topic>(`/api/courses/${courseId}/topics`, payload));
  }

  update(topicId: number, payload: TopicPayload): Promise<Topic> {
    return firstValueFrom(this.http.put<Topic>(`/api/topics/${topicId}`, payload));
  }

  delete(topicId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/topics/${topicId}`));
  }
}
