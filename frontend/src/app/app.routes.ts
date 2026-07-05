import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register').then((m) => m.RegisterPage),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage),
  },
  {
    path: 'courses/:courseId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/course/course-detail').then((m) => m.CourseDetailPage),
  },
  { path: '**', redirectTo: 'dashboard' },
];
