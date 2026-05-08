---
name: gtd-sketch-wrap-up
description: "Review sketch options with user and record the chosen direction"
tools:
  - Read
  - Write
  - Bash
---

# /gtd-sketch-wrap-up

Present sketch options to the user, record their choice, and feed the decision into planning context.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-sketch-wrap-up [N]
```

**Arguments:**
- `N` — Sketch number (defaults to most recent)

## Process

1. Read `.planning/sketches/{N}-*/COMPARISON.md`
2. Present options with file paths for review
3. Ask user which option they prefer (or blend)
4. Record decision in a DECISION.md in the sketch folder
5. Update CONTEXT.md for the relevant phase (if applicable)

Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  Sketch #{N}: {feature}                                    │
│                                                            │
│  Options:                                                  │
│    A  {name} — {one-line summary}                          │
│    B  {name} — {one-line summary}                          │
│    C  {name} — {one-line summary}                          │
│                                                            │
│  Files (open in browser):                                  │
│    .planning/sketches/{N}-{slug}/option-a.html             │
│    .planning/sketches/{N}-{slug}/option-b.html             │
│    .planning/sketches/{N}-{slug}/option-c.html             │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Which option? (A/B/C/blend)
```
