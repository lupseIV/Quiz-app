# AGENTS.md — frontend (Angular 22)

Overrides the root `AGENTS.md` for everything under `frontend/`.

## Commands (run inside `frontend/`)

| Task          | Command                    | Notes |
| ------------- | -------------------------- | ----- |
| Install deps  | `npm install`              | Node 22.22.3+ or 24.x required |
| Dev server    | `npm start`                | Proxies `/api` → `localhost:8080` via `proxy.conf.json` |
| Unit tests    | `npm test`                 | Vitest (Angular 22 default), jsdom |
| Prod build    | `npm run build`            | Includes PWA service worker (`ngsw`) |
| Format check  | `npx prettier --check src` | Prettier config in `package.json` |

There is no ESLint setup; Prettier + the Angular compiler are the gates.

## Forbidden legacy patterns (this project will reject them in review)

- **Never use NgModules** — standalone components only.
- **Never use `*ngIf` / `*ngFor` / `*ngSwitch`** — use `@if` / `@for` / `@switch`.
- **Never use constructor injection** — use `inject()`.
- **Never use RxJS-based state where a signal is sufficient** — component and
  service state is `signal()` / `computed()`. RxJS appears only at boundaries
  (`toSignal`, router param maps, one-shot `firstValueFrom` HTTP calls).
- **Never use `ReactiveFormsModule`/`FormGroup` or `ngModel`** — forms use
  Signal Forms (`form()` + `[formField]` from `@angular/forms/signals`).
- **Never fetch lists imperatively when a resource fits** — GET collections use
  `httpResource()`; mutate via `HttpClient`, then call `.reload()` on the resource.
- **Never add zone.js** — the app is zoneless (`provideZonelessChangeDetection()`).
- **Never call the Claude/Anthropic API from the frontend** — backend-only (root AGENTS.md).

## Structure

```
src/app/
├── app.ts / app.config.ts / app.routes.ts   Shell, providers, lazy routes
├── core/                  Injectable services + shared model interfaces
│   ├── models.ts          All API DTO interfaces (single source of truth)
│   ├── auth.service.ts    JWT session as a signal; localStorage persistence
│   ├── auth.interceptor.ts / auth.guard.ts
│   ├── layout.service.ts  BreakpointObserver → isHandset/isTablet/isWeb signals
│   └── *.service.ts       One HTTP service per domain (courses, topics, …)
└── features/              One folder per lazy-loaded page
    ├── auth/              login, register (Signal Forms)
    ├── dashboard/         dashboard, course-card, course-dialog
    └── course/            course-detail (tabs) + one component per tab panel
```

Conventions:

- Components are single-file (inline template + styles), named `PascalCase`
  without a `Component` suffix for pages (`LoginPage`, `DashboardPage`) and as
  nouns for widgets (`CourseCard`, `DrawingCanvas`).
- Route params bind to component inputs (`withComponentInputBinding()`).
- Tests live next to the code as `*.spec.ts`.
- Tablet-specific layout goes through `LayoutService.isTablet()` — do not
  write ad-hoc media queries for tablet behavior.
- Use Angular Material components + `--mat-sys-*` design tokens; custom CSS is
  for layout/spacing only.
