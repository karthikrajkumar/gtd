---
name: gtd-spike-wrap-up
description: "Summarize spike findings and feed verdict into planning"
tools:
  - Read
  - Write
  - Bash
---

# /gtd-spike-wrap-up

Review a completed spike and create actionable recommendations for planning.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-spike-wrap-up [N]
```

**Arguments:**
- `N` — Spike number (defaults to most recent)

## Process

1. Read `.planning/spikes/{N}-*/VERDICT.md`
2. Summarize findings
3. If VALIDATED: suggest how to incorporate into the next plan
4. If INVALIDATED: suggest alternative approaches
5. If INCONCLUSIVE: recommend follow-up spike or decision

Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  Spike #{N}: {hypothesis}                                  │
│                                                            │
│  Verdict     {VALIDATED|INVALIDATED|INCONCLUSIVE}          │
│  Time spent  {duration}                                    │
│                                                            │
│  Key findings:                                             │
│    • {finding 1}                                           │
│    • {finding 2}                                           │
│                                                            │
│  Recommendation:                                           │
│    {what to do next}                                       │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-plan-phase {N}    incorporate findings
    → /gtd-spike "..."       follow-up experiment
```
