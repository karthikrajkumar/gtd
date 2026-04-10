---
name: gtd-scan
description: "Scan and map the codebase structure, languages, frameworks, and infrastructure. Use when starting the backward pipeline or when the codebase has changed significantly."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-scan

Scan the current project to build a comprehensive codebase map.

## Usage
```
/gtd-scan [--force] [--deep] [--include-tests]
```

## Flags
- `--force` — Re-scan even if the map is current
- `--deep` — Read more files for deeper analysis
- `--include-tests` — Include test files in the index

## Process

Load and follow the workflow at:
@workflows/backward/scan-codebase.md

Pass `$ARGUMENTS` to the workflow for flag parsing.
