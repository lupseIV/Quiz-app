import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless is the Angular 22 default; stated explicitly so nobody reintroduces zone.js.
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    // withComponentInputBinding maps route params (e.g. :courseId) straight onto component inputs.
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
