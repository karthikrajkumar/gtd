---
name: gtd-milestone-summary
description: "Generate a narrative summary of a completed milestone for stakeholders"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-milestone-summary

Generate a polished, stakeholder-ready summary of what was built in a milestone. Combines phase summaries, metrics, and outcomes into a narrative document.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-milestone-summary [M]
```

**Arguments:**
- `M` — Milestone number (defaults to current)

## Process

1. Read all phase SUMMARY.md files in the milestone
2. Gather metrics (commits, files changed, tests added)
3. Map requirements delivered
4. Generate narrative summary

Output: `.planning/milestones/{M}-SUMMARY.md`

Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Milestone {M} summary generated                        │
│                                                            │
│  Phases       {count} completed                            │
│  Requirements {count} delivered                            │
│  Commits      {count}                                      │
│  Tests added  {count}                                      │
│                                                            │
│  Written to:                                               │
│    .planning/milestones/{M}-SUMMARY.md                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
