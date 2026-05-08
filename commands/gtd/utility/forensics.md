---
name: gtd-forensics
description: "Investigate project history — what changed, when, why"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-forensics

Deep investigation of project history. Answers "what changed?", "when did this break?", "why was this decided?" using git history, planning artifacts, and session archives.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-forensics "<question>" [--since <date>] [--scope <path>]
```

**Arguments:**
- `<question>` — What you want to investigate
- `--since` — Limit history window
- `--scope` — Limit to specific files/directories

## Process

Load and follow the workflow at:
@workflows/utility/forensics.md

Pass $ARGUMENTS for parsing.

## Examples
```
/gtd-forensics "when did the auth middleware change?"
/gtd-forensics "why was Redis chosen over Memcached?"
/gtd-forensics "what broke the payment flow?" --since "2 weeks ago"
/gtd-forensics "show me the timeline of the API module" --scope src/api/
```
