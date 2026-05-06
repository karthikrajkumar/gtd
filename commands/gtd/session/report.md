---
name: gtd-session-report
description: "Generate a summary of the current session's work"
tools:
  - Read
  - Write
  - Bash
---

# /gtd-session-report

Generate a human-readable summary of what happened in the current session.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-session-report
```

## Process

1. Load current state and recent git activity:
```bash
STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state get)
```

2. Gather session metrics:
   - Commits made this session (since last HANDOFF or session start)
   - Files modified
   - Phases progressed
   - Plans executed

3. Display (per references/output-style.md):

```
╭─ GTD Session Report ──────────────────────────────────────╮
│                                                            │
│  Duration     {time since session start or resume}         │
│  Commits      {count}                                      │
│  Files        {count} modified                             │
│                                                            │
│  Progress                                                  │
│    {step completed}                                        │
│    {step completed}                                        │
│    {current step in progress}                              │
│                                                            │
│  Decisions                                                 │
│    {decision 1}                                            │
│    {decision 2}                                            │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-pause    save and stop
    → /gtd-next     continue working
```
