---
name: gtd-plant-seed
description: "Plant a future idea with an optional trigger condition"
tools:
  - Read
  - Write
  - Bash
---

# /gtd-plant-seed

Plant an idea for the future. Seeds are forward-looking notes that sit dormant until a trigger condition is met (or you manually sprout them). Unlike backlog items, seeds aren't commitments — they're possibilities.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-plant-seed "<idea>" [--trigger "<when to revisit>"]
```

**Arguments:**
- `<idea>` — The future idea
- `--trigger` — When to revisit (e.g., "after auth is complete", "when we have 100 users")

## Process

1. Parse idea and trigger
2. Write to `.planning/seeds/SEEDS.json`
3. Display:

```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Seed planted                                           │
│                                                            │
│  Idea        {idea}                                        │
│  Trigger     {trigger or "manual"}                         │
│  Status      dormant                                       │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  View all seeds: /gtd-review-backlog --seeds
```

## Examples
```
/gtd-plant-seed "Add real-time collaboration" --trigger "after v2 launch"
/gtd-plant-seed "Consider GraphQL migration" --trigger "when REST endpoints exceed 50"
/gtd-plant-seed "i18n support"
```
