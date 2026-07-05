import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { MindMap } from './models';

@Injectable({ providedIn: 'root' })
export class MindMapService {
  private readonly http = inject(HttpClient);

  generate(courseId: number, topicId: number | null): Promise<MindMap> {
    return firstValueFrom(
      this.http.post<MindMap>(`/api/courses/${courseId}/mindmap/generate`, { topicId }),
    );
  }

  delete(mindMapId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/mindmaps/${mindMapId}`));
  }
}
