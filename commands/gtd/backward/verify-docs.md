---
name: gtd-verify-docs
description: "Run accuracy verification on generated documents. Cross-references all claims against actual code."
tools:
  - Read
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-verify-docs

Verify the accuracy of generated documents.

## Usage
```
/gtd-verify-docs [<doc-type>] [--strict]
```

## Flags
- `<doc-type>` — Verify specific document (tdd, hld, lld, etc.)
- `--strict` — Fail if verification score below 90%

## Process

Load and follow the workflow at:
@workflows/backward/verify-document.md
