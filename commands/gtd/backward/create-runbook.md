---
name: gtd-create-runbook
description: "Generate Operations Runbook from codebase analysis. Auto-scans and analyzes if needed."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-runbook

Generate Operations Runbook.

## Usage
```
/gtd-create-runbook [--format <standard|enterprise|startup|compliance>] [--auto]
```

## Flags
- `--format <format>` — Document format (default: config value or 'standard')
- `--auto` — Skip human review, auto-finalize

## Process

This command generates a `runbook` document using the generate-document workflow.

Load and follow the workflow at:
@workflows/backward/generate-document.md

Set `DOC_TYPE=runbook` and pass `$ARGUMENTS` for flag parsing.
