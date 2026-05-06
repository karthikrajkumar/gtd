---
name: gtd-quick
description: "Execute ad-hoc task with GTD guarantees — atomic commits, state tracking, optional research/verification"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
  - WebSearch
  - WebFetch
---

# /gtd-quick

Execute an ad-hoc task outside the phased pipeline. Same quality guarantees (atomic commits, verification) with less ceremony.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-quick [--discuss] [--research] [--validate] [--full]
```

**Flags:**
- `--discuss` — Surface gray areas before planning
- `--research` — Spawn focused researcher first
- `--validate` — Enable plan-check + post-execution verification
- `--full` — All of the above (discuss + research + validate)
- No flags — plan + execute only (default fast path)

## Process

Load and follow the workflow at:
@workflows/forward/quick.md

Pass $ARGUMENTS for flag parsing.
