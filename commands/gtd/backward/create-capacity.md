---
name: gtd-create-capacity
description: "Generate Capacity Plan from codebase analysis. Auto-scans and analyzes if needed."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-capacity

Generate Capacity Plan.

## Usage
```
/gtd-create-capacity [--format <standard|enterprise|startup|compliance>] [--auto]
```

## Flags
- `--format <format>` — Document format (default: config value or 'standard')
- `--auto` — Skip human review, auto-finalize

## Process

This command generates a `capacity` document using the generate-document workflow.

Load and follow the workflow at:
@workflows/backward/generate-document.md

Set `DOC_TYPE=capacity` and pass `$ARGUMENTS` for flag parsing.
