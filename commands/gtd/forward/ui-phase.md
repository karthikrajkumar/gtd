---
name: gtd-ui-phase
description: "Generate a UI specification for a phase — component hierarchy, states, accessibility"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-ui-phase

Generate a detailed UI specification for a phase. Bridges design decisions to implementation with component hierarchy, state management, accessibility, and responsive requirements.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-ui-phase [N]
```

**Arguments:**
- `N` — Phase number (defaults to current phase from STATE.md)

## Process

Load and follow the workflow at:
@workflows/forward/ui-phase.md

Pass $ARGUMENTS for parsing.
