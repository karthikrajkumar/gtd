---
name: gtd-sketch
description: "Create rapid UI mockups as self-contained HTML for visual feedback"
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - WebSearch
---

# /gtd-sketch

Create 2-3 rapid HTML mockups of a feature or screen. Self-contained files that open directly in a browser for immediate visual feedback.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-sketch "<feature/screen>" [--options <N>] [--style <tailwind|vanilla|existing>]
```

**Arguments:**
- `<feature/screen>` — What to mock up
- `--options` — Number of alternatives (default: 2, max: 4)
- `--style` — CSS approach (default: auto-detect from project)

## Process

Load and follow the workflow at:
@workflows/forward/sketch.md

Pass $ARGUMENTS for parsing.

## Examples
```
/gtd-sketch "user dashboard with activity feed and stats"
/gtd-sketch "checkout flow - 3 step wizard" --options 3
/gtd-sketch "settings page" --style tailwind
```
