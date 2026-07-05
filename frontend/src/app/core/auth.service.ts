import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthUser } from './models';

const STORAGE_KEY = 'examprep.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly state = signal<AuthUser | null>(restore());

  readonly user = this.state.asReadonly();
  readonly isLoggedIn = computed(() => this.state() !== null);
  readonly token = computed(() => this.state()?.token ?? null);

  async login(email: string, password: string): Promise<void> {
    const user = await firstValueFrom(
      this.http.post<AuthUser>('/api/auth/login', { email, password }),
    );
    this.persist(user);
  }

  async register(email: string, name: string, password: string): Promise<void> {
    const user = await firstValueFrom(
      this.http.post<AuthUser>('/api/auth/register', { email, name, password }),
    );
    this.persist(user);
  }

  logout(): void {
    this.state.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigateByUrl('/login');
  }

  private persist(user: AuthUser): void {
    this.state.set(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

function restore(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
