# Contributing to Get Things Done (GTD)

Thank you for your interest in contributing! GTD is a bidirectional spec-driven agentic framework.

## Development Setup

```bash
git clone https://github.com/get-things-done/get-things-done.git
cd get-things-done
npm install
npm test
```

## Project Structure

- `bin/` — Entry points (installer, CLI tools)
- `lib/` — Shared infrastructure modules (CJS)
- `agents/` — Agent definitions (Markdown + YAML frontmatter)
  - `forward/` — Research, planning, execution agents
  - `backward/` — Analysis, writing, verification agents
  - `sync/` — Drift detection, reconciliation agents
- `commands/gtd/` — User-facing commands
- `workflows/` — Orchestration logic
- `templates/` — Document and plan templates
- `tests/` — Test files
- `test-fixtures/` — Sample projects for testing

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## Code Style

- CJS (CommonJS) for all `lib/` and `bin/` files (maximum Node.js compatibility)
- ESLint + Prettier enforced via pre-commit hooks
- `absent = enabled` pattern for config defaults

## Commit Convention

Use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `test:` — Test additions/changes
- `refactor:` — Code restructuring
- `chore:` — Build, CI, dependency updates
