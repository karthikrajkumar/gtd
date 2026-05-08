---
name: gtd-stats
description: "Show project statistics — commits, phases, agents used, time spent"
tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# /gtd-stats

Show comprehensive project statistics: commit history, phase progress, agent usage patterns, and time metrics.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-stats [--since <date>] [--phase <N>]
```

**Flags:**
- `--since` — Only count activity since this date
- `--phase` — Scope to a specific phase

## Process

1. Gather metrics:
```bash
COMMITS=$(git rev-list --count HEAD)
BRANCH=$(git rev-parse --abbrev-ref HEAD)
PHASES=$(ls .planning/phases/ 2>/dev/null | wc -l)
DOCS=$(ls .planning/documents/ 2>/dev/null | wc -l)
SPIKES=$(ls .planning/spikes/ 2>/dev/null | wc -l)
SKETCHES=$(ls .planning/sketches/ 2>/dev/null | wc -l)
QUICK=$(ls .planning/quick/ 2>/dev/null | wc -l)
```

2. Display (per references/output-style.md):
```
╭─ GTD Project Stats ───────────────────────────────────────╮
│                                                            │
│  Project      {name from PROJECT.md}                       │
│  Branch       {branch}                                     │
│  Commits      {total} ({since_last_session} this session)  │
│                                                            │
│  Forward Pipeline                                          │
│    Phases     {completed}/{total}                           │
│    Plans      {executed}/{total} tasks executed             │
│    Quick      {count} ad-hoc tasks                         │
│    Spikes     {count} ({validated}/{invalidated})           │
│    Sketches   {count}                                      │
│                                                            │
│  Backward Pipeline                                         │
│    Documents  {generated}/{7} types                         │
│    Accuracy   {avg_score}%                                 │
│                                                            │
│  Sync                                                      │
│    Last drift {time ago}                                   │
│    Drift items {count}                                     │
│                                                            │
│  Sessions                                                  │
│    Pauses     {count}                                      │
│    Total time {estimate from session archives}             │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
