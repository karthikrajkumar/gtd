---
name: gtd-audit-milestone
description: "Full audit of a completed milestone — coverage, quality, gaps"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-audit-milestone

Comprehensive audit of a completed milestone. Checks requirement coverage, test coverage, document staleness, and overall quality across all phases in the milestone.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-audit-milestone [M]
```

**Arguments:**
- `M` — Milestone number (defaults to current)

## Process

1. Identify all phases in this milestone
2. For each phase, check:
   - Requirements coverage (UAT)
   - Test coverage
   - Document accuracy (drift since generation)
   - Code quality signals (linting, type errors)
3. Aggregate scores
4. Identify gaps and recommend remediation

Display:
```
╭─ GTD Milestone Audit ─────────────────────────────────────╮
│                                                            │
│  Milestone {M}: {name}                                     │
│  Phases: {phases in milestone}                             │
│                                                            │
│  Requirements   {met}/{total} ({%})                        │
│  Test coverage  {%}                                        │
│  Doc accuracy   {%}                                        │
│  Code quality   {score}/10                                 │
│                                                            │
│  Gaps:                                                     │
│    ⚠ {gap 1}                                              │
│    ⚠ {gap 2}                                              │
│                                                            │
│  Overall: {READY | NEEDS WORK | CRITICAL GAPS}             │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
