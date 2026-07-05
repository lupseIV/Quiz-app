import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

/**
 * Exposes the current screen class as signals. Tablet gets its own bucket
 * (not lumped in with desktop/mobile) because notes and mind-maps are
 * primarily used on tablets.
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly breakpoints = inject(BreakpointObserver);

  readonly isHandset = toSignal(
    this.breakpoints.observe(Breakpoints.Handset).pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly isTablet = toSignal(
    this.breakpoints.observe(Breakpoints.Tablet).pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly isWeb = toSignal(
    this.breakpoints.observe(Breakpoints.Web).pipe(map((r) => r.matches)),
    { initialValue: true },
  );
}
