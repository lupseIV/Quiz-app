# Feature Backlog

Ideas drawn from comparable study apps (Anki, Quizlet, StudySmarter/Knowt,
RemNote, GoodNotes/Notability, Khan Academy, Forest, Notion). Not commitments —
pick one, build it on a `feature/<slug>` branch, and follow
`docs/DOCUMENTATION-POLICY.md` (new use case entry, README update, tests).

Priority: **P1** = high student value / low-medium effort, **P2** = valuable
but bigger, **P3** = nice-to-have.

## Learning & retention

- [ ] **P1 — Spaced-repetition flashcards** (Anki, Quizlet): AI generates
  question/answer cards per topic; SM-2-style scheduler resurfaces cards on
  due dates; "cards due today" badge on dashboard cards.
- [ ] **P1 — Difficulty-adaptive quizzes** (Khan Academy): feed past
  per-question results into the quiz prompt so Claude targets weak areas;
  add an "exam mode" with more questions and a timer.
- [ ] **P2 — Wrong-answer review deck** (Quizlet "starred terms"): auto-collect
  missed quiz questions into a re-drillable set per course.
- [ ] **P2 — Explain-my-mistake**: after quiz submission, a per-question "Why?"
  button asks Claude to explain the correct answer using the course material.
- [ ] **P3 — Verbal quiz mode** (StudySmarter): chat-driven Q&A round where the
  AI asks, the student answers free-text, and the AI grades leniency-scored.

## Content input

- [ ] **P1 — PDF/slide upload with text extraction** (StudySmarter, Knowt):
  upload lecture PDFs, extract text server-side into topic content.
- [ ] **P2 — OCR for handwritten notes** (GoodNotes, Notability): send canvas
  PNGs through OCR (or Claude vision) so handwriting can feed quizzes/chat.
- [ ] **P2 — Audio note transcription** (Notability): record a lecture snippet,
  transcribe to topic content.
- [ ] **P3 — Web clipper / URL import**: paste an article URL, backend fetches
  and strips it into topic content.

## Handwriting notes — GoodNotes-level canvas

Bring `DrawingCanvas` up to par with GoodNotes/Notability. The canvas already
stores strokes as vector data (points + color + width), which is the right
foundation for most of these.

- [ ] **P1 — Pixel/partial eraser** (GoodNotes "standard eraser"): erasing
  removes only the hovered part of a stroke, not the whole stroke — split the
  stroke's point list at the erased segment into two strokes instead of
  deleting it. Keep the current whole-stroke eraser as a second mode
  ("stroke eraser"), like GoodNotes offers both.
- [ ] **P1 — Highlighter tool** (GoodNotes): semi-transparent wide strokes
  (multiply blending, fixed opacity ~35%), drawn *under* pen strokes; own
  color row (yellow/green/pink/blue/orange).
- [ ] **P1 — Multiple pen types** (GoodNotes fountain/ball/brush pens):
  ball pen (uniform width), fountain pen (stronger pressure→width curve),
  brush pen (velocity-sensitive width); pen type saved per stroke.
- [ ] **P1 — Scribble-to-erase gesture** (Apple Pencil "Scribble", GoodNotes):
  detect a rapid zig-zag scribble over existing strokes (high direction-change
  count in a small bounding box within ~1s) and delete the strokes underneath
  it — e.g. squiggle over a wrong word and it disappears.
- [ ] **P2 — Shape tool / shape recognition** (GoodNotes shape pen): explicit
  shape mode (line, rectangle, ellipse, arrow) drawn by drag; stretch: hold at
  stroke end to auto-snap a rough freehand shape to the perfect primitive.
- [ ] **P2 — Full color picker** (GoodNotes color presets + custom): replace
  the fixed 6-swatch row with recent-colors row + full HSL/hex picker; keep
  per-tool (pen vs highlighter) color memory.
- [ ] **P2 — Multi-page notebooks with vertical scroll** (GoodNotes pages):
  a drawing note becomes a list of pages scrolled vertically; "add page"
  appears when scrolling past the last page; pages saved/exported
  individually (model change: one DRAWING note → ordered page images or a
  pages JSON with vector strokes).
- [ ] **P2 — Store strokes as vectors server-side**: persist the stroke JSON
  alongside (or instead of) the flattened PNG so notes stay re-editable after
  reload — prerequisite for reopening/editing saved drawings like GoodNotes.
- [ ] **P3 — Lasso select + move/resize** (GoodNotes lasso): select strokes by
  circling them, then drag/scale/recolor the selection.
- [ ] **P3 — Paper templates**: ruled/grid/dotted/blank page backgrounds per
  notebook, rendered under the ink and included in exports.

## Study habits & motivation

- [ ] **P1 — Study streaks + reminders** (Duolingo, Forest): daily activity
  streak on the dashboard; exam-countdown email/push reminders
  ("7 days left, last score 3/5 — take another quiz?").
- [ ] **P2 — Study planner** (my-study-life-style): auto-split remaining days
  before each exam into a per-topic revision schedule.
- [ ] **P3 — Focus timer** (Forest, Pomodoro apps): per-course pomodoro timer;
  log focused minutes per course and chart them.

## Collaboration & sharing

- [ ] **P2 — Shared course packs** (Quizlet sets): export/import a course
  (topics + flashcards) as JSON; optionally a public link, read-only.
- [ ] **P3 — Study groups**: invite classmates to a shared course; shared
  chat/quiz leaderboard.

## Platform & UX

- [ ] **P1 — Dark mode**: Material `color-scheme: light dark` with a toggle
  (theme tokens are already in place via `mat.theme()`).
- [ ] **P2 — Offline PWA data** (Anki): cache courses/topics/notes in
  IndexedDB; queue mutations while offline and sync on reconnect.
- [ ] **P2 — Global search**: search across courses, topics, notes, and chat
  history from the toolbar.
- [ ] **P3 — Note organization upgrades** (GoodNotes): pin notes, tags,
  full-screen canvas, palm rejection tuning, export drawing as PDF.
  (Canvas *tooling* upgrades live in the dedicated handwriting section above.)
- [ ] **P3 — Refresh tokens + httpOnly cookie auth**: move JWT out of
  localStorage to a refresh-token scheme for better security posture.

## Data hygiene / technical debt

- [ ] **P1 — Cascade deletes**: deleting a course currently leaves orphaned
  topics/notes/quizzes/chat/mind-maps rows; add FK cascades or service-level
  cleanup (and a test proving it).
- [ ] **P2 — DB migrations**: replace Hibernate `ddl-auto: update` with
  Flyway before any production deployment.
- [ ] **P2 — AI response streaming**: stream chat replies token-by-token
  (SSE) instead of waiting for the full response.
- [ ] **P3 — Redis-backed rate limiter**: swap the in-memory `AiRateLimiter`
  when the backend scales beyond one instance.
