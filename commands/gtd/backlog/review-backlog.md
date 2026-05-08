---
name: gtd-review-backlog
description: "Review backlog items, seeds, and threads — filter and prioritize"
tools:
  - Read
  - Write
  - Bash
  - Grep
---

# /gtd-review-backlog

Review and manage the project backlog, seeds, and threads.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-review-backlog [--seeds] [--threads] [--priority <high|medium|low>] [--tag <tag>]
```

**Flags:**
- `--seeds` — Show seeds instead of backlog
- `--threads` — Show active threads
- `--priority` — Filter by priority
- `--tag` — Filter by tag

## Process

1. Load items from appropriate source
2. Apply filters
3. Display:

**Backlog view:**
```
╭─ GTD Backlog ─────────────────────────────────────────────╮
│                                                            │
│  Open items: {count}                                       │
│                                                            │
│  HIGH                                                      │
│    #{id}  {title}                    [{tags}]              │
│    #{id}  {title}                    [{tags}]              │
│                                                            │
│  MEDIUM                                                    │
│    #{id}  {title}                    [{tags}]              │
│                                                            │
│  LOW                                                       │
│    #{id}  {title}                    [{tags}]              │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Actions:
    → /gtd-quick "#{id} title"     execute a backlog item
    → /gtd-add-backlog "..."       add new item
```

**Seeds view:**
```
╭─ GTD Seeds ───────────────────────────────────────────────╮
│                                                            │
│  Dormant: {count}  |  Sprouted: {count}                    │
│                                                            │
│  #{id}  {idea}                                             │
│         Trigger: {trigger}                                 │
│                                                            │
│  #{id}  {idea}                                             │
│         Trigger: {trigger}                                 │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

**Threads view:**
```
╭─ GTD Threads ─────────────────────────────────────────────╮
│                                                            │
│  Active: {count}                                           │
│                                                            │
│  {slug}    {name}                                          │
│            {description}     (last entry: {date})          │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
