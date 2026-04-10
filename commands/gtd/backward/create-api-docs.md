---
name: gtd-create-api-docs
description: "Generate API Documentation from codebase analysis. Auto-scans and analyzes if needed."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-api-docs

Generate API Documentation.

## Usage
```
/gtd-create-api-docs [--format <standard|enterprise|startup|compliance>] [--auto]
```

## Flags
- `--format <format>` — Document format (default: config value or 'standard')
- `--auto` — Skip human review, auto-finalize

## Process

This command generates a `api-docs` document using the generate-document workflow.

Load and follow the workflow at:
@workflows/backward/generate-document.md

Set `DOC_TYPE=api-docs` and pass `$ARGUMENTS` for flag parsing.
