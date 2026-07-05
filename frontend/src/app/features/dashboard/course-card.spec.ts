import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { Course } from '../../core/models';
import { CourseCard } from './course-card';

function isoDaysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('CourseCard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseCard],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  function createCard(course: Partial<Course>) {
    const fixture = TestBed.createComponent(CourseCard);
    fixture.componentRef.setInput('course', {
      id: 1,
      name: 'Biology',
      examDate: null,
      description: null,
      ...course,
    });
    return fixture;
  }

  it('shows a countdown for a future exam', async () => {
    const fixture = createCard({ examDate: isoDaysFromToday(12) });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Exam in 12 days');
  });

  it('shows "today" when the exam is today', async () => {
    const fixture = createCard({ examDate: isoDaysFromToday(0) });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Exam is today!');
  });

  it('marks exams within a week as urgent', async () => {
    const fixture = createCard({ examDate: isoDaysFromToday(3) });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.urgent')).toBeTruthy();
  });

  it('shows the last quiz score when present', async () => {
    const fixture = createCard({ lastScore: 4, lastTotal: 5 });
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Last quiz: 4/5');
  });

  it('handles a missing exam date', async () => {
    const fixture = createCard({});
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('No exam date set');
  });
});
