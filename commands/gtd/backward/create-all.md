---
name: gtd-create-all
description: "Generate the full 7-document suite (TDD, HLD, LLD, Capacity, System Design, API Docs, Runbook). Auto-scans and analyzes first."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-create-all

Generate all 7 technical documents in one run.

## Usage
```
/gtd-create-all [--format <format>] [--auto] [--parallel]
```

## Flags
- `--format <format>` — Document format for all documents
- `--auto` — Skip human review for each document
- `--parallel` — Generate multiple documents concurrently

## Process

Load and follow the workflow at:
@workflows/backward/create-all.md

Pass `$ARGUMENTS` for flag parsing.
