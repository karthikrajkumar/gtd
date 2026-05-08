---
name: gtd-ui-review
description: "Review implemented UI against spec — accessibility, responsiveness, consistency"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-ui-review

Review implemented UI code against the UI specification. Checks accessibility, responsive behavior, state handling, and design consistency.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-ui-review [N]
```

**Arguments:**
- `N` — Phase number (defaults to current phase)

## Process

Load and follow the workflow at:
@workflows/forward/ui-review.md

Pass $ARGUMENTS for parsing.
