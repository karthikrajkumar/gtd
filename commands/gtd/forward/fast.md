---
name: gtd-fast
description: "Execute trivial task inline — skip planning entirely, one commit, done"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
---

# /gtd-fast

Execute a trivial task immediately. No plan file, no research, no verification ceremony.
Just describe what you want, and it gets done in one atomic commit.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-fast <description>
```

## Process

Load and follow the workflow at:
@workflows/forward/fast.md

Pass $ARGUMENTS as the task description.
