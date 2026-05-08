---
name: gtd-add-backlog
description: "Add an item to the project backlog"
tools:
  - Read
  - Write
  - Bash
---

# /gtd-add-backlog

Add a task, feature, or bug to the project backlog. Backlog items are commitments (unlike seeds which are possibilities).

## Required Reading
@references/output-style.md

## Usage
```
/gtd-add-backlog "<title>" [--priority <high|medium|low>] [--tags <tag1,tag2>]
```

**Arguments:**
- `<title>` — What needs to be done
- `--priority` — Priority level (default: medium)
- `--tags` — Comma-separated tags for categorization

## Process

1. Parse title, priority, tags
2. Add to `.planning/todos/BACKLOG.json`
3. Display:

```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Added to backlog                                       │
│                                                            │
│  #{id}  {title}                                            │
│  Priority   {priority}                                     │
│  Tags       {tags}                                         │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

## Examples
```
/gtd-add-backlog "Add password reset flow" --priority high --tags auth,email
/gtd-add-backlog "Improve error messages" --tags ux
/gtd-add-backlog "Migrate to Vitest" --priority low --tags testing,infra
```
