import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, required, submit } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    FormField,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-wrap">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Log in</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (submit)="$event.preventDefault(); onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" [formField]="f.email" autocomplete="email" />
              @if (f.email().touched() && f.email().invalid()) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input
                matInput
                type="password"
                [formField]="f.password"
                autocomplete="current-password"
              />
              @if (f.password().touched() && f.password().invalid()) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>
            @if (error()) {
              <p class="error-text">{{ error() }}</p>
            }
            <button matButton="filled" type="submit" [disabled]="submitting()">
              @if (submitting()) {
                <mat-spinner diameter="20" />
              } @else {
                Log in
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <a matButton routerLink="/register">No account? Register</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .auth-wrap {
      display: flex;
      justify-content: center;
      padding-top: 8vh;
    }
    mat-card {
      width: min(420px, 100%);
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 16px;
    }
    .error-text {
      color: var(--mat-sys-error);
      margin: 0 0 12px;
    }
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly f = form(this.model, (path) => {
    required(path.email);
    email(path.email);
    required(path.password);
  });

  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    await submit(this.f, async (field) => {
      this.submitting.set(true);
      try {
        const { email, password } = field().value();
        await this.auth.login(email, password);
        this.router.navigateByUrl('/dashboard');
      } catch (err: unknown) {
        this.error.set(extractMessage(err, 'Login failed'));
      } finally {
        this.submitting.set(false);
      }
    });
  }
}

export function extractMessage(err: unknown, fallback: string): string {
  const httpError = err as { error?: { message?: string } };
  return httpError?.error?.message ?? fallback;
}
