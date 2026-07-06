# Exam Prep

A full-stack study app: manage courses and topics, take notes by keyboard **or**
handwriting (stylus/tablet canvas), and let Claude generate quizzes, answer
questions about your material, and draw colorful mind-maps for visual learners.

- **Frontend**: Angular 22 (standalone components, signals, signal forms,
  resource API, zoneless, Angular Material M3, PWA/installable)
- **Backend**: Spring Boot 4 (Java 21, Gradle), PostgreSQL, JWT auth,
  Claude API integration with per-user rate limiting

## Prerequisites

| Tool   | Version              |
| ------ | -------------------- |
| Node   | 22.22.3+ or 24.x     |
| Java   | 21+                  |
| Docker | any recent version   |

You do **not** need to install PostgreSQL or Gradle (the Gradle wrapper is
committed; Postgres runs in Docker).

## Quick start

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Set your Claude API key

The AI features (quiz generation, chat, mind-maps) call Anthropic's API from
the backend. Get a key from https://console.anthropic.com and export it:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Without a key the app still runs — only the AI endpoints will fail.

### 3. Run the backend

```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun
```

The `local` profile provides a dev-only JWT secret and seeds demo data on
first run: log in as **demo@example.com** / **password123** to explore three
pre-filled courses.

Configuration is environment-variable driven (see `backend/src/main/resources/application.yml`):

| Variable                | Default                                  | Purpose                        |
| ----------------------- | ---------------------------------------- | ------------------------------ |
| `DB_URL`                | `jdbc:postgresql://localhost:5432/examprep` | Postgres JDBC URL           |
| `DB_USERNAME` / `DB_PASSWORD` | `examprep` / `examprep`            | Postgres credentials           |
| `JWT_SECRET`            | *(required outside `local` profile)*     | HMAC secret, ≥32 chars         |
| `ANTHROPIC_API_KEY`     | *(empty)*                                | Claude API key                 |
| `ANTHROPIC_MODEL`       | `claude-sonnet-5`                        | Claude model for AI features   |
| `AI_REQUESTS_PER_MINUTE`| `10`                                     | Per-user AI rate limit         |

### 4. Run the frontend

```bash
cd frontend
npm install
npm start
```

Open http://localhost:4200. Dev-server API calls to `/api` are proxied to the
backend on port 8080 (`frontend/proxy.conf.json`).

## Running tests

```bash
# Backend: unit + integration tests (H2 in-memory DB, no Docker needed)
cd backend && ./gradlew test

# Frontend: Vitest unit tests
cd frontend && npm test
```

## Production build

```bash
cd frontend && npm run build     # outputs dist/frontend, incl. service worker (PWA)
cd backend && ./gradlew bootJar  # outputs build/libs/exam-prep-backend-0.0.1-SNAPSHOT.jar
```

The PWA manifest + service worker are generated in production builds, so the
app can be installed to the home screen on tablets/phones/desktop.

To run the backend jar in Docker alongside Postgres:

```bash
cd backend && ./gradlew bootJar && cd ..
docker compose --profile backend up
```

## Project layout

```
├── backend/    Spring Boot 4 API (see backend/AGENTS.md for conventions)
├── frontend/   Angular 22 app  (see frontend/AGENTS.md for conventions)
├── docs/       USE_CASES.md · TODO-FEATURES.md · DOCUMENTATION-POLICY.md
├── docker-compose.yml
└── README.md
```

Detailed actor/flow documentation for every feature lives in
`docs/USE_CASES.md`. Contribution rules (docs must be updated with every
change; all work on dedicated branches) are in `docs/DOCUMENTATION-POLICY.md`.

## Feature overview

- **Auth** — register/login with JWT; all course data is scoped per user
- **Courses** — CRUD with exam-date countdown on dashboard cards
- **Topics** — per-course study material (pasted lecture text) that grounds the AI
- **Notes** — typed notes and handwritten canvas drawings (Pointer Events,
  pressure-sensitive, pen/eraser/undo/redo), stored together per course/topic
- **AI quiz** — 5 multiple-choice questions generated from your topics,
  validated server-side, scored on submit, with per-course history
- **AI chat** — per-course tutor grounded in your topic content, history persisted
- **Mind-maps** — AI-generated node trees with per-branch colors and mnemonic
  catchphrases, rendered with D3 and saved for revisiting

### Planned features

Spaced-repetition flashcards, PDF/slide upload with text extraction, study
streaks/reminders, difficulty-adaptive quizzes, and more — the prioritized
backlog is in `docs/TODO-FEATURES.md`.
