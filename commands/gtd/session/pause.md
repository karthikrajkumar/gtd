---
name: gtd-pause
description: "Save current session state for resuming in a fresh context window"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-pause

Save session state so you can resume in a fresh context window without losing progress.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-pause [--summary "what I was doing"]
```

## Process

Load and follow the workflow at:
@workflows/session/pause.md

Pass $ARGUMENTS for flag parsing.
