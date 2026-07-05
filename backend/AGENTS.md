# AGENTS.md — backend (Spring Boot 4)

Overrides the root `AGENTS.md` for everything under `backend/`.

## Commands (run inside `backend/`)

| Task         | Command |
| ------------ | ------- |
| Run dev      | `SPRING_PROFILES_ACTIVE=local ./gradlew bootRun` (needs Postgres: `docker compose up -d postgres` at repo root) |
| All tests    | `./gradlew test` (uses H2 in-memory via the `test` profile — no Docker needed) |
| Build jar    | `./gradlew bootJar` |
| Full build   | `./gradlew build` |

No migration tool; schema is Hibernate `ddl-auto: update`.

## Spring Boot 4 gotchas (do not apply Boot 3 reflexes)

- **Jackson 3**: import from `tools.jackson.databind.*` / `tools.jackson.core.*`,
  NOT `com.fasterxml.jackson.*`. The auto-configured `ObjectMapper` bean is
  `tools.jackson.databind.ObjectMapper`.
- **Modularized starters**: `RestClient.Builder` auto-config requires
  `spring-boot-starter-restclient`; MockMvc test support requires
  `spring-boot-starter-webmvc-test` and lives at
  `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`.
- **Never use `@MockBean`** (removed) — use `@MockitoBean` if a Spring-context
  mock is needed; prefer plain Mockito unit tests without a context.
- **Never use Maven** — Gradle (Kotlin DSL, `build.gradle.kts`) exclusively.
- A bean with multiple constructors needs `@Autowired` on the one Spring
  should use (see `AiRateLimiter`).

## Structure

Package-by-feature under `src/main/java/com/examprep/`:

```
com/examprep/
├── ExamPrepApplication.java
├── config/        SecurityConfig, JwtService, JwtAuthFilter, AuthUser principal
├── common/        GlobalExceptionHandler + shared exceptions (NotFound, Ai, RateLimit)
├── ai/            AiService (ONLY Claude API gateway) + AiRateLimiter
├── auth/          AuthController/Service + dto/
├── user/          User entity + repository
├── course/        Course entity, repo, service, controller + dto/
├── topic/  note/  quiz/  chat/  mindmap/   (same layering per feature)
└── seed/          DataSeeder (local profile only; demo@example.com / password123)
```

Conventions:

- Layering: Controller → Service → Repository. Controllers never touch
  repositories; services own transactions.
- DTOs are Java records in each feature's `dto/` subpackage, with Bean
  Validation annotations. Entities are never serialized to the API.
- Controllers take the authenticated user via
  `@AuthenticationPrincipal AuthUser user`; services take `Long userId` as
  their first parameter and enforce ownership through
  `CourseService.getOwned(userId, courseId)`.
- Every endpoint that triggers a Claude call must invoke
  `AiRateLimiter.checkAndRecord(userId)` *after* validation, *before* the call.
- AI responses are parsed via `AiService.extractJson` and validated before
  they reach a client (see `QuizService.parseAndValidate`).
- Tests live in `src/test/java` mirroring the main packages: plain
  JUnit 5 + Mockito for services, `@SpringBootTest` + MockMvc + H2
  (profile `test`) for controller/integration flows.
- Config lives in `application.yml` with env-var placeholders;
  `application-local.yml` holds dev-only defaults. Never add secrets to either.
