---
name: gtd-create-tdd
description: "Generate Technical Design Document from codebase analysis. Auto-scans and analyzes if needed."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-tdd

Generate Technical Design Document.

## Usage
```
/gtd-create-tdd [--format <standard|enterprise|startup|compliance>] [--auto]
```

## Flags
- `--format <format>` — Document format (default: config value or 'standard')
- `--auto` — Skip human review, auto-finalize

## Process

This command generates a `tdd` document using the generate-document workflow.

Load and follow the workflow at:
@workflows/backward/generate-document.md

Set `DOC_TYPE=tdd` and pass `$ARGUMENTS` for flag parsing.
