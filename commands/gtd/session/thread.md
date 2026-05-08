---
name: gtd-thread
description: "Create or append to a persistent context thread"
tools:
  - Read
  - Write
  - Bash
---

# /gtd-thread

Manage persistent context threads. Threads are running notes about a topic that persist across sessions — useful for tracking ongoing decisions, research, or design evolution.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-thread create "<name>" [--description "<desc>"]
/gtd-thread append <slug> "<content>"
/gtd-thread list
/gtd-thread read <slug>
```

## Process

### Create
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Thread created                                         │
│                                                            │
│  Name        {name}                                        │
│  Slug        {slug}                                        │
│  Location    .planning/threads/{slug}/THREAD.md            │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

### Append
Adds a timestamped entry to the thread.

### List
Shows all active threads with last-updated date.

### Read
Displays thread contents.

## Examples
```
/gtd-thread create "Architecture Decisions" --description "Running log of arch decisions"
/gtd-thread append architecture-decisions "Decided to use event sourcing for audit trail"
/gtd-thread list
/gtd-thread read architecture-decisions
```
