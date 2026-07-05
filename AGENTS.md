# AGENTS.md — root

Instructions for AI agents working on this repo. Scoped rules live in
`frontend/AGENTS.md` and `backend/AGENTS.md`; those **override this file** for
files in their subtree. `CLAUDE.md` defers here.

## What this repo is

Two independent apps in one repo. App features/business logic are documented
in `README.md`, not here.

```
├── frontend/            Angular 22 SPA (see frontend/AGENTS.md)
├── backend/             Spring Boot 4 REST API (see backend/AGENTS.md)
├── docker-compose.yml   Local Postgres 17 (+ optional backend container)
├── README.md            Human-facing setup docs
├── AGENTS.md            This file
└── CLAUDE.md            Claude-specific pointer to this file
```

## Versions (do not assume older APIs)

| Component   | Version | Command to verify        |
| ----------- | ------- | ------------------------ |
| Angular     | 22.0.x  | `cd frontend && npx ng version` |
| Node        | 22.22.3+ / 24.x | `node --version` |
| Spring Boot | 4.0.7   | `backend/build.gradle.kts` |
| Java        | 21      | `java --version`         |
| Gradle      | 8.14.3 (wrapper) | `backend/gradle/wrapper/gradle-wrapper.properties` |
| PostgreSQL  | 17 (Docker) | `docker-compose.yml` |

## Commands (from repo root)

| Task            | Command |
| --------------- | ------- |
| Start Postgres  | `docker compose up -d postgres` |
| Backend dev     | `cd backend && SPRING_PROFILES_ACTIVE=local ./gradlew bootRun` |
| Backend tests   | `cd backend && ./gradlew test` |
| Frontend dev    | `cd frontend && npm start` |
| Frontend tests  | `cd frontend && npm test` |
| Frontend build  | `cd frontend && npm run build` |

There are no DB migrations; the schema comes from Hibernate `ddl-auto: update`.

## Architectural boundaries (non-negotiable)

- The Claude API key must **never** reach the frontend. All AI calls go
  through `AiService` in the backend (`backend/src/main/java/com/examprep/ai/`).
- Every AI endpoint must go through `AiRateLimiter` before calling Claude.
- All course-scoped reads/writes must verify ownership via
  `CourseService.getOwned(userId, courseId)` — never trust a raw courseId.
- Secrets (JWT secret, API key, DB password) come from environment variables
  only. Never hardcode them or commit `.env` files.
- The frontend talks to the backend only via `/api/**` JSON endpoints.

## Cross-cutting rules

- Do not add a new dependency without a stated reason in the PR/commit message.
- Do not leave commented-out code.
- Commit messages: imperative mood summary line ("Add quiz history endpoint"),
  no mandated prefix format.
- If you change a command, version, or structural convention, update the
  relevant `AGENTS.md` (and `CLAUDE.md` if Claude-specific) **in the same
  change**. These files must never go stale.

## Before you finish (checklist)

1. `cd backend && ./gradlew test` — green.
2. `cd frontend && npm test` — green.
3. `cd frontend && npm run build` — compiles without errors.
4. No commented-out code, no stray debug logging, no new unexplained deps.
5. AGENTS/CLAUDE files updated if you changed commands/versions/conventions.
