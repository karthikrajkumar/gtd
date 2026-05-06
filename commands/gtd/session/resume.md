---
name: gtd-resume
description: "Restore session from a previous pause — pick up where you left off"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-resume

Restore context from a previous `/gtd-pause`. Reads HANDOFF.json and reconstructs the session state so you can continue seamlessly.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-resume
```

## Process

Load and follow the workflow at:
@workflows/session/resume.md
