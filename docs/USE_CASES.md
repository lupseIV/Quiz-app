# Use Cases

Current as of branch `claude/exam-prep-fullstack-build-e7ezqx`. Per
`docs/DOCUMENTATION-POLICY.md`, any change to a flow, endpoint, or rule
referenced here MUST update this file in the same change.

## Actors

| Actor | Description |
| ----- | ----------- |
| **Guest** | Unauthenticated visitor; can only register or log in |
| **Student** | Registered, logged-in user; owns courses and all data under them |
| **Claude API** | External system actor (Anthropic API) called only by the backend `AiService` |
| **System** | The Spring Boot backend enforcing auth, ownership, validation, rate limits |

Common exceptional flows (apply to every Student use case, not repeated below):

- **E-AUTH**: Missing/expired/invalid JWT → System responds 401/403; the
  frontend interceptor logs the user out and redirects to `/login`.
- **E-OWN**: The referenced course/topic/note/quiz/mind-map does not belong to
  the Student → System responds 404 (existence is not revealed).

---

## UC-01 Register

- **Actor**: Guest
- **Description**: Create an account with email, name, and password.
- **Preconditions**: No valid session; email not yet registered.
- **Postconditions**: User persisted with a BCrypt password hash; JWT issued
  and stored client-side; Guest becomes Student and lands on the dashboard.
- **Normal flow**:
  1. Guest opens `/register` and fills name, email, password (Signal Form).
  2. Frontend validates (required, email format, password ≥ 8 chars).
  3. `POST /api/auth/register`; System re-validates, hashes the password, saves the user.
  4. System returns `{token, userId, email, name}`; frontend persists it and navigates to `/dashboard`.
- **Exceptional flow**:
  - E1: Email already registered → 400 "An account with this email already exists", shown inline.
  - E2: Server-side validation fails → 400 with per-field messages.

## UC-02 Log in

- **Actor**: Guest
- **Description**: Authenticate and obtain a JWT.
- **Preconditions**: Account exists.
- **Postconditions**: JWT stored (localStorage); session signal set; dashboard shown.
- **Normal flow**:
  1. Guest opens `/login`, submits email + password.
  2. `POST /api/auth/login`; System verifies the BCrypt hash.
  3. Token returned and persisted; redirect to `/dashboard`.
- **Exceptional flow**:
  - E1: Unknown email or wrong password → 401 "Invalid email or password" (identical message for both, no user enumeration).

## UC-03 Log out

- **Actor**: Student
- **Description**: End the session.
- **Preconditions**: Logged in.
- **Postconditions**: Token removed from memory and localStorage; redirected to `/login`; guarded routes inaccessible.
- **Normal flow**: Student clicks the logout icon in the toolbar → `AuthService.logout()` clears state and navigates.
- **Alternative flow**: A1: Any API call returns 401 (expired token) → interceptor performs the same logout automatically.

## UC-04 View dashboard

- **Actor**: Student
- **Description**: See all courses as cards with exam countdown, last quiz score, and quick actions.
- **Preconditions**: Logged in.
- **Postconditions**: None (read-only).
- **Normal flow**:
  1. Route guard admits the Student to `/dashboard`.
  2. `GET /api/courses` via `httpResource` returns courses sorted by soonest exam date, each with `lastScore`/`lastTotal` of the most recent submitted quiz.
  3. Cards render countdown ("Exam in N days", computed signal; ≤ 7 days highlighted as urgent).
- **Alternative flows**:
  - A1: Student switches sort to "Name" or types in the filter field — list recomputes client-side.
  - A2: No courses exist → empty state with "Add your first course" call to action.
  - A3: Student clicks "Generate quiz" on a card → UC-11 starts directly (course page opens on the Quiz tab with auto-generate).

## UC-05 Create course

- **Actor**: Student
- **Description**: Add a course with name, exam date, description.
- **Preconditions**: Logged in.
- **Postconditions**: Course persisted, owned by the Student; dashboard list reloaded.
- **Normal flow**:
  1. Student clicks "Add course"; dialog with Signal Form opens.
  2. Student enters name (required), optional exam date and description; saves.
  3. `POST /api/courses` → 201; dialog closes; course list resource reloads.
- **Exceptional flow**: E1: Blank name → client blocks submit; server would return 400.

## UC-06 Edit course

- **Actor**: Student
- **Description**: Change name, exam date, or description.
- **Preconditions**: Logged in; course exists and is owned (else E-OWN).
- **Postconditions**: Course updated; lists refreshed.
- **Normal flow**: Card menu → "Edit" → same dialog prefilled → `PUT /api/courses/{id}` → list reload.

## UC-07 Delete course

- **Actor**: Student
- **Description**: Remove a course.
- **Preconditions**: Logged in; course owned (else E-OWN).
- **Postconditions**: Course row deleted; list refreshed. (Child rows are not
  cascaded at DB level — see docs/TODO-FEATURES.md, "Data hygiene".)
- **Normal flow**: Card menu → "Delete" → browser confirm → `DELETE /api/courses/{id}` → 204 → snackbar + reload.
- **Alternative flow**: A1: Student cancels the confirm dialog → nothing happens.

## UC-08 Manage topics (add / edit / delete)

- **Actor**: Student
- **Description**: Maintain the study material (title + free-text content) that grounds all AI features.
- **Preconditions**: Logged in; parent course owned (else E-OWN).
- **Postconditions**: Topic created/updated/deleted; topics resource reloaded.
- **Normal flow (add)**:
  1. Course page → Topics tab → "Add topic".
  2. Dialog (Signal Form): title required, content optional (pasted lecture text).
  3. `POST /api/courses/{courseId}/topics` → 201 → accordion refreshes.
- **Alternative flows**:
  - A1 (edit): Expansion panel → "Edit" → prefilled dialog → `PUT /api/topics/{id}`.
  - A2 (delete): "Delete" → confirm → `DELETE /api/topics/{id}` → 204.

## UC-09 Create typed note

- **Actor**: Student
- **Description**: Save a keyboard-typed note attached to the course or one of its topics.
- **Preconditions**: Logged in; course owned.
- **Postconditions**: `Note(type=TEXT)` persisted with timestamps; notes list (drawings + text mixed, newest first) refreshed.
- **Normal flow**:
  1. Notes tab, input mode toggle on "Keyboard" (default).
  2. Optionally pick a topic in "Attach to topic"; type the note.
  3. "Save note" → `POST /api/courses/{id}/notes` with `type=TEXT`.
- **Exceptional flow**: E1: Blank text → save button disabled; server would return 400 ("Text notes require textContent").

## UC-10 Create handwritten note

- **Actor**: Student (typically on a tablet with stylus)
- **Description**: Draw/handwrite on a canvas and save it as an image note.
- **Preconditions**: Logged in; course owned; device with pointer input (pen, touch, or mouse all work — Pointer Events API).
- **Postconditions**: `Note(type=DRAWING)` persisted with a base64 PNG; canvas cleared; list refreshed.
- **Normal flow**:
  1. Notes tab → toggle "Handwriting".
  2. Student draws; pen pressure modulates stroke width where reported; toolbar offers pen/eraser, 6 colors, stroke width slider.
  3. "Save drawing" → canvas exports PNG data-URL → `POST .../notes` with `type=DRAWING`.
- **Alternative flows**:
  - A1: Undo/redo replay the stroke history; "Clear canvas" (with confirm) resets it.
  - A2: Delete an existing note from its card (confirm → `DELETE /api/notes/{id}`).
- **Exceptional flow**: E1: Empty canvas → save disabled; server would return 400 ("Drawing notes require imageData").

## UC-11 Generate AI quiz

- **Actor**: Student; Claude API (secondary)
- **Description**: Produce 5 multiple-choice questions from the course's topic content.
- **Preconditions**: Logged in; course owned; ≥ 1 topic with non-blank content; AI rate-limit budget available; `ANTHROPIC_API_KEY` configured server-side.
- **Postconditions**: `QuizAttempt` (score = null) and its `QuizQuestion` rows persisted; questions shown WITHOUT correct answers.
- **Normal flow**:
  1. Quiz tab → "Generate quiz from my topics" (or auto-start via dashboard quick action).
  2. `POST /api/courses/{id}/quiz/generate`; System checks ownership, content, then records one rate-limit token.
  3. `AiService` sends topic material to Claude requesting a strict JSON array.
  4. System extracts and validates the JSON (array non-empty; each item has question, ≥ 2 options, correctAnswer ∈ options).
  5. Attempt + questions saved; `{quizId, questions[id, questionText, options]}` returned; form renders (Signal Forms, radio per option).
- **Exceptional flows**:
  - E1: No topic content → 400 "Add at least one topic with content…".
  - E2: Rate limit exhausted → 429 with retry hint.
  - E3: Claude unreachable or returns malformed/invalid JSON → 502 `AiException` message; nothing persisted (transaction rolls back); UI shows the error and keeps the overview.

## UC-12 Take and submit quiz

- **Actor**: Student
- **Description**: Answer the generated questions and get a scored result.
- **Preconditions**: UC-11 completed; quiz not yet submitted.
- **Postconditions**: `userAnswer` saved per question; `score` set on the attempt; result (with correct answers revealed) displayed; history + dashboard `lastScore` reflect it.
- **Normal flow**:
  1. Student selects one option per question; submit stays disabled until all are answered.
  2. `POST /api/courses/{id}/quiz/{quizId}/submit` with `[{questionId, answer}]`.
  3. System scores server-side, persists, returns per-question results (correct flag, correctAnswer, userAnswer).
  4. UI shows score and per-question review; snackbar with the score.
- **Exceptional flows**:
  - E1: Quiz already submitted → 400 "This quiz has already been submitted".
  - E2: quizId not under this course → 404.

## UC-13 View quiz history

- **Actor**: Student
- **Description**: See past attempts (score, date) for a course to track progress.
- **Preconditions**: Logged in; course owned.
- **Postconditions**: None (read-only).
- **Normal flow**: Quiz tab overview lists attempts from `GET /api/courses/{id}/quiz/attempts`, newest first, with an icon tier by score ratio.
- **Alternative flow**: A1: A stored result can be re-fetched via `GET /api/courses/{id}/quiz/{quizId}/result` (submitted attempts only; unsubmitted → 404).

## UC-14 Chat with AI about a course

- **Actor**: Student; Claude API (secondary)
- **Description**: Ask questions answered from the course's own material.
- **Preconditions**: Logged in; course owned; rate-limit budget; API key configured.
- **Postconditions**: Both the user message and Claude's reply persisted as `ChatMessage` rows; conversation restored on revisit.
- **Normal flow**:
  1. AI Chat tab loads history (`GET /api/courses/{id}/chat/history`).
  2. Student sends a message; it appears immediately (optimistic bubble).
  3. `POST /api/courses/{id}/chat`; System stores the message, builds a system prompt embedding all topic content, sends the last 20 turns to Claude.
  4. Reply stored and rendered.
- **Exceptional flows**:
  - E1: Claude call fails / rate limited → an inline assistant-style error bubble appears; the typed message remains stored.
  - E2: Message > 4000 chars or blank → 400.
- **Alternative flow**: A1: Course has no topics → Claude is told "(no topics added yet)" and says the material doesn't cover the question before answering generally.

## UC-15 Generate visual mind-map

- **Actor**: Student (visual learner); Claude API (secondary)
- **Description**: Turn course/topic content into a colored node tree where every node carries a mnemonic catchphrase.
- **Preconditions**: Logged in; course owned; selected scope (whole course or one topic) has non-blank content; rate-limit budget; API key configured.
- **Postconditions**: `MindMap` persisted (title + nodes JSON); rendered as a D3 tree with per-branch colors; available on revisit without regeneration.
- **Normal flow**:
  1. Mind-maps tab → choose scope ("Whole course" or a topic) → "Generate visual map".
  2. `POST /api/courses/{id}/mindmap/generate` with `{topicId|null}`; System validates, rate-limits, prompts Claude for strict `{title, root{label, catchphrase, color, children[]}}` JSON.
  3. System validates the shape (root with non-blank label), saves, returns it.
  4. Frontend renders via d3-hierarchy: root node dark, each depth-1 branch its own hue inherited by descendants, catchphrases in italics.
- **Exceptional flows**:
  - E1: No content in scope → 400 "Add topic content before generating a mind-map".
  - E2: Rate limit → 429. E3: Malformed AI JSON → 502, nothing saved.
- **Alternative flows**:
  - A1 (regenerate): Run generation again with the same scope — a new map is added; old ones remain.
  - A2 (delete): "Delete" on a saved map → confirm → `DELETE /api/mindmaps/{id}`.

## UC-16 Install as PWA

- **Actor**: Student
- **Description**: Install the app to a tablet/phone/desktop home screen.
- **Preconditions**: Production build served over HTTPS (or localhost); browser supports PWA install.
- **Postconditions**: App installed with manifest icons; app shell cached by the Angular service worker for offline loading.
- **Normal flow**: Browser shows its install affordance → Student accepts → app opens standalone.
- **Exceptional flow**: E1: Offline — the shell loads from cache but API calls fail; data features require connectivity (no offline sync yet — see TODO).
