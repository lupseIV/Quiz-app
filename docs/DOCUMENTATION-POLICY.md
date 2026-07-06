# Documentation & Branch Policy (BINDING)

These rules are **mandatory** for every contributor — human or AI agent —
making any modification to this repository. Root `AGENTS.md` and `CLAUDE.md`
point here; nested AGENTS files do not override this file.

## 1. Documentation must never go stale

Every change that alters behavior, structure, commands, or versions MUST
update the affected documentation **in the same commit/PR** — never "later".

| If you change… | You MUST update… |
| -------------- | ---------------- |
| A user-facing flow, endpoint, validation rule, or error behavior | `docs/USE_CASES.md` (the affected UC: flows, pre/postconditions) |
| A new feature (any size) | `docs/USE_CASES.md` (new UC entry) **and** `docs/TODO-FEATURES.md` (move/remove the item if it was listed) **and** `README.md` feature overview |
| A command, version, dependency, or project structure | Root `AGENTS.md` (+ `README.md` prerequisites/commands if user-facing) |
| Anything under `frontend/` affecting conventions/structure | `frontend/AGENTS.md` |
| Anything under `backend/` affecting conventions/structure/Boot-4 gotchas | `backend/AGENTS.md` |
| AI prompt shapes or AI response JSON contracts | `CLAUDE.md` note targets: backend parser/validator + `frontend/src/app/core/models.ts` + `docs/USE_CASES.md` |
| Setup steps, env vars, ports, profiles | `README.md` |

A change is **incomplete and must not be merged** if the table above names a
file it did not update. Reviewers and agents must treat missing doc updates
exactly like failing tests.

## 2. All work happens on branches

- **Never commit directly to `main`/`master`.**
- Every new feature, fix, or doc change gets its **own branch**:
  - features: `feature/<short-slug>` (e.g. `feature/flashcards`)
  - fixes: `fix/<short-slug>`
  - docs-only: `docs/<short-slug>`
  - AI agents keep their assigned `claude/<slug>` branch if one was designated.
- One branch = one coherent change. Do not mix unrelated features.
- Branches merge only when the "Definition of done" below is satisfied.

## 3. Definition of done (checklist — all boxes required)

1. `cd backend && ./gradlew test` green.
2. `cd frontend && npm test` green.
3. `cd frontend && npm run build` compiles.
4. Every documentation file named by the table in §1 updated in this change.
5. New behavior covered by at least one test (unit or integration).
6. No secrets, no commented-out code, no unexplained new dependencies.
7. Work is on a dedicated branch per §2, with an imperative-mood commit message.

## 4. Scope of "documentation files"

The canonical documentation set this policy protects:

```
README.md                    Human setup + feature overview
AGENTS.md                    Root agent instructions (versions, commands, boundaries)
CLAUDE.md                    Claude-specific notes
frontend/AGENTS.md           Frontend conventions
backend/AGENTS.md            Backend conventions
docs/USE_CASES.md            Actor/flow documentation of every feature
docs/TODO-FEATURES.md        Feature backlog
docs/DOCUMENTATION-POLICY.md This file
```

Adding a new documentation file? Add it to this list in the same change.
