import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthService } from './auth.service';
import { Course } from './models';

export interface CoursePayload {
  name: string;
  examDate: string | null;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  /**
   * Resource API: the course list re-fetches whenever the reactive request
   * recomputes (login/logout) and can be re-fetched imperatively via reload().
   */
  readonly courses = httpResource<Course[]>(
    () => (this.auth.isLoggedIn() ? '/api/courses' : undefined),
    { defaultValue: [] },
  );

  async create(payload: CoursePayload): Promise<Course> {
    const course = await firstValueFrom(this.http.post<Course>('/api/courses', payload));
    this.courses.reload();
    return course;
  }

  async update(id: number, payload: CoursePayload): Promise<Course> {
    const course = await firstValueFrom(this.http.put<Course>(`/api/courses/${id}`, payload));
    this.courses.reload();
    return course;
  }

  async delete(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/courses/${id}`));
    this.courses.reload();
  }
}
