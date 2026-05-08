---
name: gtd-spike
description: "Run a time-boxed technical experiment to validate assumptions before planning"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# /gtd-spike

Run a focused technical experiment (spike) to answer a specific question before committing to a plan. Produces a structured verdict with evidence.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-spike "<hypothesis>" [--time-box <minutes>]
```

**Arguments:**
- `<hypothesis>` — What you want to validate (e.g., "pdfkit can render Arabic text")
- `--time-box` — Max agent time in minutes (default: 30)

## Process

Load and follow the workflow at:
@workflows/forward/spike.md

Pass $ARGUMENTS for parsing.

## Examples
```
/gtd-spike "Redis pub/sub can handle 10k msg/sec on a single node"
/gtd-spike "Stripe webhooks can be verified with our existing middleware"
/gtd-spike "SQLite is fast enough for 100k rows with full-text search" --time-box 15
```
