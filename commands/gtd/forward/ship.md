---
name: gtd-ship
description: "Create PR from verified phase work — auto-generated title and body"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-ship

Create a pull request from verified phase work. Generates title from phase name and body from execution summaries.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-ship [N] [--draft]
```

**Arguments:**
- `N` — Phase number (defaults to current phase from STATE.md)
- `--draft` — Create as draft PR

## Process

Load and follow the workflow at:
@workflows/forward/ship.md

Pass $ARGUMENTS for flag parsing.
