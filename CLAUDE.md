# CLAUDE.md

Read `AGENTS.md` first — it is the source of truth for structure, versions,
commands, and boundaries. Nested `frontend/AGENTS.md` and `backend/AGENTS.md`
override it within their subtrees. This file only adds Claude-specific notes;
do not duplicate content from those files here.

## Claude-specific notes

- When editing Angular code, do not fall back to pre-v17 idioms from training
  data (NgModules, `*ngIf`, constructor DI, RxJS state). The enforced modern
  idioms are listed in `frontend/AGENTS.md`.
- When editing Spring code, this is Boot **4** / Framework **7**: Jackson lives
  in `tools.jackson.*` (not `com.fasterxml.jackson.*`), and MockMvc test
  support comes from `spring-boot-starter-webmvc-test`
  (`org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`).
  Details in `backend/AGENTS.md`.
- Prefer small, verifiable steps: run the module's test command (see
  `AGENTS.md` command table) after each meaningful change rather than batching.
- The AI prompts sent to Claude are defined server-side in `QuizService`,
  `ChatService`, and `MindMapService`. If you change their expected JSON
  shapes, update both the backend parser/validator and the frontend models in
  `frontend/src/app/core/models.ts` in the same change.
