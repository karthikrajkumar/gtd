---
name: gtd-audit-uat
description: "Run user acceptance testing criteria against implemented phase"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-audit-uat

Verify that a phase meets user acceptance criteria from REQUIREMENTS.md. Maps each requirement to implementation evidence.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-audit-uat [N]
```

**Arguments:**
- `N` — Phase number (defaults to current)

## Process

1. Load requirements mapped to this phase (from ROADMAP.md)
2. For each requirement:
   - Find implementation evidence (code, tests, config)
   - Check: is it fully implemented, partial, or missing?
   - Note: test coverage for this requirement
3. Score and report

Display:
```
╭─ GTD UAT Audit ───────────────────────────────────────────╮
│                                                            │
│  Phase {N}: {name}                                         │
│  Score: {passed}/{total} requirements met                  │
│                                                            │
│  ✓  REQ-001  User can register with email                 │
│  ✓  REQ-002  Password hashing with bcrypt                 │
│  ◐  REQ-003  Email verification (partial — no resend)     │
│  ✗  REQ-004  OAuth login (not implemented)                │
│                                                            │
│  Coverage: {score}%                                        │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-execute-phase {N}    implement missing items
    → /gtd-ship {N}             ship as-is (with known gaps)
```
