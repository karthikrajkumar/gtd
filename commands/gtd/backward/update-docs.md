---
name: gtd-update-docs
description: "Incrementally update documents when code changes — only re-generates affected sections. (Full implementation in Phase 13)"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-update-docs

Incrementally update generated documents based on code changes.

## Usage
```
/gtd-update-docs [--since <commit>] [--doc <type>]
```

## Flags
- `--since <commit>` — Compare against specific commit (default: last generation commit)
- `--doc <type>` — Update only a specific document type

## Process

Uses `gtd-tools.cjs` for diff analysis and state management.
Full implementation in Phase 13 (Incremental Updates).
For now, use `/gtd-create-<type> --force` to regenerate a document.
