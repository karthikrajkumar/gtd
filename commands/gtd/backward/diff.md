---
name: gtd-diff
description: "Show what code changed since last document generation and which document sections are affected. (Full implementation in Phase 13)"
tools:
  - Read
  - Bash
---

# /gtd-diff

Show code changes and their impact on documents.

## Usage
```
/gtd-diff [--doc <type>] [--since <commit>]
```

## Process

Uses `gtd-tools.cjs` for state and analysis cache comparison.
Full implementation in Phase 13 (Incremental Updates).
For now, use `git diff --stat` to see what changed.
