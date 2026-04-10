---
name: gtd-create-lld
description: "Generate Low-Level Design from codebase analysis. Auto-scans and analyzes if needed."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-lld

Generate Low-Level Design.

## Usage
```
/gtd-create-lld [--format <standard|enterprise|startup|compliance>] [--auto]
```

## Flags
- `--format <format>` — Document format (default: config value or 'standard')
- `--auto` — Skip human review, auto-finalize

## Process

This command generates a `lld` document using the generate-document workflow.

Load and follow the workflow at:
@workflows/backward/generate-document.md

Set `DOC_TYPE=lld` and pass `$ARGUMENTS` for flag parsing.
