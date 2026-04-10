---
name: gtd-map-codebase
description: "Alias for /gtd-scan — Map codebase structure. Also used by forward pipeline for brownfield import."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-map-codebase

Map the codebase structure. This is an alias for `/gtd-scan` that is also used by the forward pipeline when importing a brownfield project.

## Usage
```
/gtd-map-codebase [--force] [--deep]
```

## Process

Load and follow the workflow at:
@workflows/backward/scan-codebase.md

Pass `$ARGUMENTS` for flag parsing.
