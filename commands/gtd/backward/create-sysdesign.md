---
name: gtd-create-sysdesign
description: "Generate System Design from codebase analysis. Auto-scans and analyzes if needed."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-sysdesign

Generate System Design.

## Usage
```
/gtd-create-sysdesign [--format <standard|enterprise|startup|compliance>] [--auto]
```

## Flags
- `--format <format>` — Document format (default: config value or 'standard')
- `--auto` — Skip human review, auto-finalize

## Process

This command generates a `system-design` document using the generate-document workflow.

Load and follow the workflow at:
@workflows/backward/generate-document.md

Set `DOC_TYPE=system-design` and pass `$ARGUMENTS` for flag parsing.
