# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TaskFlow is an educational task-management web application built for the KOSTA "Claude Code 기반 개발 자동화" course. This is the **step-0 starter version**—a minimal working app without testing infrastructure, CI, or advanced features. It progresses through seven stages, each adding automation and code quality practices.

**Tech Stack**: Node.js 20+, Express, EJS templates, better-sqlite3, Jest/supertest

## Quick Start

```bash
npm install
cp .env.example .env                  # Fill in values (PORT, DB_PATH required)
npm start                             # http://localhost:3000
npm test                              # Run Jest suite
npm test -- taskService.test.js       # Run single test file
npm test -- --testNamePattern="pattern"  # Run tests matching a pattern
```

## Architecture: 4-Layer Single-Direction Dependency

```
HTTP Request
    ↓
routes/taskRoutes.js         ← REST endpoint definitions
    ↓
controllers/taskController.js ← Input validation, DTO transformation, status codes
    ↓
services/taskService.js      ← Business logic, database queries (parameterized SQL)
    ↓
db/database.js               ← better-sqlite3 connection, schema initialization
    ↓
Data (SQLite file at DB_PATH)
```

**Dependency rule**: Each layer imports only from layers below it. Controllers never touch the database directly; services never handle HTTP.

## Core Concepts

### REST API Contract

| Method | Path | Purpose | Success | Error |
|--------|------|---------|---------|-------|
| GET | `/` | Render task list (EJS view) | 200 | 500 |
| GET | `/api/tasks` | JSON task list (with optional filters) | 200 | 500 |
| POST | `/api/tasks` | Create task | 201 | 400 (missing title) / 500 |
| PUT | `/api/tasks/:id` | Partial update (any field) | 200 | 404 (not found) / 500 |
| DELETE | `/api/tasks/:id` | Delete task | 204 (no body) | 404 (not found) / 500 |

**GET /api/tasks query parameters (optional)**:
- `status` – Filter by exact status match (e.g., `?status=todo`)
- `search` – Filter by title substring match (e.g., `?search=버그`)
- `page` – Pagination: 1-indexed page number (e.g., `?page=2`). When omitted, returns plain array. When present, returns envelope with `{ data, page, pageSize, total, totalPages }`
- `pageSize` – Items per page (default 20, max 100, e.g., `?page=1&pageSize=50`)

**Contract**: 400 = validation failure, 404 = record not found, 500 = unhandled error. POST returns full task object; DELETE returns empty body with 204.

### Database Schema

```sql
CREATE TABLE tasks (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT NOT NULL,
  description TEXT,
  status    TEXT DEFAULT 'todo',
  assignee  TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)
```

**Current limitations**:
- `status` field has no whitelist validation (accepts any string). This is intentional—step-5 adds enum validation.
- All fields except `title` are optional.
- No explicit timestamps for updates (only `created_at`).

**Filtering and pagination** (GET /api/tasks):
- Without `page` param: returns plain JSON array, all matching rows in `id DESC` order.
- With `page` param: returns envelope object `{ data, page, pageSize, total, totalPages }`, items paginated in `id DESC` order.
- `status` filter: case-sensitive exact match (unvalidated, accepts any string).
- `search` filter: case-sensitive substring match on `title` field only. Wildcard characters (`%`, `_`) are escaped, so a search for `50%` matches the literal string `50%`, not a SQL wildcard.
- Invalid `page`/`pageSize` values (non-integer, negative, zero, out-of-range) are clamped to sane defaults (page 1, pageSize 20–100) without 400 error.

### Controller Input Validation

`taskController.validateTaskInput()` enforces that `title` is a non-empty string. All other fields bypass validation and flow through; the service layer passes them to SQL.

## Testing

Tests live in `tests/` using Jest and supertest. The starter has minimal coverage (~2 tests); the full course brings this to 31 tests by step-6.

**Test patterns**:
- Unit tests for `taskService` (database isolation: each test uses an in-memory database or transaction rollback).
- Integration tests for `taskController` (HTTP assertions via supertest).
- Database tests use `db.prepare().run()` for setup/teardown.

Run a single test file: `npm test -- tests/taskService.test.js`

## Course Progression (Upcoming Steps)

This step-0 starter evolves through step-6, adding at each stage:

1. **Step-1**: CLAUDE.md (you are here), testing infrastructure setup
2. **Step-2**: Automated test generation and test review
3. **Step-3**: Documentation and refactoring workflows
4. **Step-4**: Git automation, PR templates, code review
5. **Step-5**: Bug fixes (e.g., status field validation), setting permissions
6. **Step-6**: Notifications service (email, Slack), side-effect design patterns

**Checkpoint**: Full completed version with all 31 tests is in `labs/taskflow-completed/`.

## Environment Variables

`.env` (create from `.env.example`):
- `PORT` – Server port (default 3000)
- `DB_PATH` – SQLite database file path (default `data/taskflow.db`)
- `SMTP_*` / `SLACK_WEBHOOK_URL` – Notifications (added in step-6)

Database directory is auto-created if missing.

## Key Invariants

1. **Layering is strict**: Routes don't touch the database; controllers don't write SQL.
2. **SQL is parameterized**: All queries in `taskService` use `?` placeholders to prevent injection.
3. **DTO transformation happens once**: `taskController.toTaskDTO()` is the single point where database rows become JSON.
4. **No side effects in services**: `taskService` functions are pure database operations; notifications/logging belong elsewhere (step-6).
5. **Status values are unvalidated**: Until step-5, any string is accepted. Tests should not assume enum behavior.

## For Future Steps

When working on later stages, remember:
- Tests drive validation (step-2: write tests first, then implement).
- Refactoring is isolated from feature work (step-3: separate PRs for cleanup vs. logic).
- Git hooks enforce code quality (step-4: pre-commit linting, post-commit formatting).
- Permission boundaries prevent accidental secrets in code (step-5: allow/deny sensitive operations).
- Notifications are separate services (step-6: email/Slack are decoupled, testable via mocks).
