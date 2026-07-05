import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { Note, NoteType } from './models';

export interface NotePayload {
  topicId: number | null;
  type: NoteType;
  textContent: string | null;
  imageData: string | null;
}

@Injectable({ providedIn: 'root' })
export class NotesService {
  private readonly http = inject(HttpClient);

  create(courseId: number, payload: NotePayload): Promise<Note> {
    return firstValueFrom(this.http.post<Note>(`/api/courses/${courseId}/notes`, payload));
  }

  update(noteId: number, payload: NotePayload): Promise<Note> {
    return firstValueFrom(this.http.put<Note>(`/api/notes/${noteId}`, payload));
  }

  delete(noteId: number): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/notes/${noteId}`));
  }
}
