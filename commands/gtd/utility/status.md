---
name: gtd-status
description: "Show full pipeline status dashboard — forward progress, backward documents, sync alignment, analysis cache, metrics."
tools:
  - Read
  - Bash
---

# /gtd-status

Show the GTD pipeline status dashboard.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-status
```

## Process

1. Load state:
```bash
STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state get)
ANALYSIS=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" analysis status)
DOCS=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" doc list)
```

2. Display formatted dashboard (per references/output-style.md):

```
╭─ GTD Pipeline ────────────────────────────────────────────╮
│                                                            │
│  FORWARD >>>  Milestone: {name}                            │
│                                                            │
│    P1      P2      P3      P4      P5      P6             │
│   [✓]  → [✓]  → [◐]  → [ ○ ] → [ ○ ] → [ ○ ]           │
│   {n1}    {n2}    {n3}    {n4}    {n5}    {n6}            │
│                                                            │
│  BACKWARD <<<                                              │
│                                                            │
│    TDD {s}  HLD {s}  LLD {s}  API {s}  Sys {s}  Run {s}  │
│                                                            │
│  SYNC <><>                                                 │
│                                                            │
│    Last check: {time} │ Drift: {N} items │ {synced|stale}  │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Current: Phase {N} — {name} ({step in progress})

  Next:
    → {recommended command}   {description}
```

Status symbols: ✓ = done, ◐ = in progress, ○ = pending, ⚠ = stale

3. Suggest next action based on state.
