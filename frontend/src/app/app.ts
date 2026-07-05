import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="app-toolbar">
      <a routerLink="/dashboard" class="brand">
        <mat-icon>school</mat-icon>
        <span>Exam Prep</span>
      </a>
      <span class="spacer"></span>
      @if (auth.isLoggedIn()) {
        <span class="user-name">{{ auth.user()?.name }}</span>
        <button matIconButton (click)="auth.logout()" aria-label="Log out">
          <mat-icon>logout</mat-icon>
        </button>
      }
    </mat-toolbar>
    <main class="app-content">
      <router-outlet />
    </main>
  `,
  styles: `
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: inherit;
      text-decoration: none;
      font: var(--mat-sys-title-large);
    }
    .spacer {
      flex: 1;
    }
    .user-name {
      margin-right: 8px;
      font: var(--mat-sys-body-medium);
    }
    .app-content {
      max-width: 1100px;
      margin: 0 auto;
      padding: 16px;
    }
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
}
