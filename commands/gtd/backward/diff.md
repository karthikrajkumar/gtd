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

## Status
This command will be fully implemented in Phase 13 (Incremental Updates).
For now, use `git diff --stat` to see what changed.
