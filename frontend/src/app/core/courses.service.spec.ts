import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.setItem(
      'examprep.auth',
      JSON.stringify({ token: 'jwt-1', userId: 1, email: 'a@b.com', name: 'Ana' }),
    );
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(CoursesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('loads the course list through the resource when logged in', async () => {
    // TestBed.tick() runs the effect that kicks off the httpResource request.
    TestBed.tick();
    const req = httpMock.expectOne('/api/courses');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Biology', examDate: '2026-08-01', description: null }]);
    await TestBed.inject((await import('@angular/core')).ApplicationRef).whenStable();

    expect(service.courses.value()).toHaveLength(1);
    expect(service.courses.value()[0].name).toBe('Biology');
  });

  it('create posts the payload and reloads the list', async () => {
    TestBed.tick();
    httpMock.expectOne('/api/courses').flush([]);

    const createPromise = service.create({ name: 'Physics', examDate: null, description: null });
    const post = httpMock.expectOne((r) => r.method === 'POST' && r.url === '/api/courses');
    post.flush({ id: 2, name: 'Physics', examDate: null, description: null });
    const created = await createPromise;
    expect(created.id).toBe(2);

    // create() reloads the resource, which issues a fresh GET.
    TestBed.tick();
    httpMock
      .expectOne((r) => r.method === 'GET' && r.url === '/api/courses')
      .flush([{ id: 2, name: 'Physics', examDate: null, description: null }]);
  });
});
