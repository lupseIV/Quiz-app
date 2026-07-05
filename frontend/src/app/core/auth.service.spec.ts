import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // logout() navigates to /login, so the test router needs a matching route
        provideRouter([{ path: '**', children: [] }]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts logged out with no stored session', () => {
    expect(service.isLoggedIn()).toBe(false);
    expect(service.token()).toBeNull();
  });

  it('login stores the user and exposes the token as a signal', async () => {
    const loginPromise = service.login('ana@example.com', 'password123');
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'ana@example.com', password: 'password123' });
    req.flush({ token: 'jwt-1', userId: 1, email: 'ana@example.com', name: 'Ana' });
    await loginPromise;

    expect(service.isLoggedIn()).toBe(true);
    expect(service.token()).toBe('jwt-1');
    expect(service.user()?.name).toBe('Ana');
    expect(localStorage.getItem('examprep.auth')).toContain('jwt-1');
  });

  it('register posts email, name and password', async () => {
    const registerPromise = service.register('bo@example.com', 'Bo', 'password123');
    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.body).toEqual({ email: 'bo@example.com', name: 'Bo', password: 'password123' });
    req.flush({ token: 'jwt-2', userId: 2, email: 'bo@example.com', name: 'Bo' });
    await registerPromise;

    expect(service.isLoggedIn()).toBe(true);
  });

  it('logout clears state and storage', async () => {
    const loginPromise = service.login('ana@example.com', 'password123');
    httpMock
      .expectOne('/api/auth/login')
      .flush({ token: 'jwt-1', userId: 1, email: 'ana@example.com', name: 'Ana' });
    await loginPromise;

    service.logout();

    expect(service.isLoggedIn()).toBe(false);
    expect(localStorage.getItem('examprep.auth')).toBeNull();
  });
});
