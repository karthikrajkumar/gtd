---
name: gtd-workstreams
description: "Manage parallel workstreams for large projects with multiple tracks"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-workstreams

Manage parallel workstreams when a project has multiple independent tracks of work (e.g., API + Frontend + Infrastructure running in parallel).

## Required Reading
@references/output-style.md

## Usage
```
/gtd-workstreams list
/gtd-workstreams create "<name>" --phases <N-M>
/gtd-workstreams switch <name>
/gtd-workstreams status
```

## Subcommands

### list
Show all workstreams with their phase ranges and status.

### create
Create a new workstream covering specific phases:
```
/gtd-workstreams create "frontend" --phases 3-5
/gtd-workstreams create "api" --phases 1-2
```

### switch
Set the active workstream context. Subsequent commands operate within this workstream.

### status
Show progress across all workstreams:
```
╭─ GTD Workstreams ─────────────────────────────────────────╮
│                                                            │
│  Active: {current workstream}                              │
│                                                            │
│  api        P1 ✓  P2 ◐                     [2/2 phases]  │
│  frontend   P3 ✓  P4 ◐  P5 ○              [1/3 phases]  │
│  infra      P6 ○  P7 ○                     [0/2 phases]  │
│                                                            │
│  Overall: {completed}/{total} phases                       │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-workstreams switch {name}
    → /gtd-execute-phase {N}
```

## Storage

Workstream config lives in `.planning/config.json`:
```json
{
  "workstreams": {
    "active": "frontend",
    "streams": {
      "api": { "phases": [1, 2], "status": "in_progress" },
      "frontend": { "phases": [3, 4, 5], "status": "in_progress" },
      "infra": { "phases": [6, 7], "status": "pending" }
    }
  }
}
```
