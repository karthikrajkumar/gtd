# Output Style Guide

> Reference document for ALL GTD workflows and commands.
> Defines how output is rendered to the user across every interaction.
> Goal: Polished, scannable, consistent — like a well-designed CLI, not debug logs.

---

## Core Principles

1. **Scannable** — The user should grasp the result in 2 seconds without reading every word
2. **Consistent** — Same patterns everywhere (success looks the same in every command)
3. **Actionable** — Always end with what to do next
4. **Quiet by default** — Show results, not process. Don't narrate what you're about to do.
5. **Celebrate progress** — Mark completions clearly. Building software is hard.

---

## Status Symbols

Use these consistently across ALL output:

| Symbol | Meaning | When to use |
|--------|---------|-------------|
| `✓` | Complete / success | Task done, phase complete, verification passed |
| `✗` | Failed / error | Verification failed, build error, test failure |
| `◐` | In progress | Currently running, partially complete |
| `○` | Pending / queued | Not started yet, waiting for dependencies |
| `⚠` | Warning | Non-fatal issue, attention needed |
| `→` | Next action | Suggested next command |
| `│` | Continuation | Vertical connector for grouped info |

---

## Completion Blocks

When a command finishes successfully, render a bordered block:

```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ {Action completed}                                     │
│                                                            │
│  {Key}       {Value}                                       │
│  {Key}       {Value}                                       │
│  {Key}       {Value}                                       │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → {/gtd-command}   {one-line description}
    → {/gtd-command}   {alternative path}
```

**Example — new-project complete:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Project initialized                                    │
│                                                            │
│  Project      invoice-api                                  │
│  Vision       "REST API for freelancer invoicing"          │
│  Stack        Node.js + Fastify + PostgreSQL               │
│                                                            │
│  Requirements                                              │
│    v1          12 must-haves                                │
│    v2           8 future                                    │
│    excluded     5 out of scope                              │
│                                                            │
│  Phases       6 (standard granularity)                     │
│  Research     ✓ complete (4 agents, 14s)                   │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-discuss-phase 1   shape how Phase 1 gets built
    → /gtd-plan-phase 1      skip discussion, go to planning
    → /gtd-quick             quick ad-hoc task
```

**Example — phase execution complete:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Phase 2 executed                                       │
│                                                            │
│  Plans        3 executed (2 parallel + 1 sequential)       │
│  Commits      7 atomic commits                             │
│  Tests        48 passing, 0 failing                        │
│  Duration     2m 34s                                       │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-verify-work 2     confirm it works as expected
    → /gtd-ship 2            create PR (skip verification)
```

---

## Progress Indicators

When spawning agents or running multi-step operations, show progress:

```
  ◐ Researching...

    ✓ STACK              complete (3.2s)
    ✓ FEATURES           complete (4.1s)
    ◐ ARCHITECTURE       running...
    ○ PITFALLS           queued
```

After all complete:
```
  ✓ Research complete (4 agents, 12s total)
```

For plan execution waves:
```
  ◐ Executing Phase 3...

    Wave 1 (parallel):
      ✓ Plan 01: Database schema       3 commits
      ✓ Plan 02: API endpoints         4 commits

    Wave 2 (sequential):
      ◐ Plan 03: Integration tests     running...
```

---

## Pipeline Dashboard (/gtd-status)

```
╭─ GTD Pipeline ────────────────────────────────────────────╮
│                                                            │
│  FORWARD >>>  Milestone: v1.0                              │
│                                                            │
│    P1      P2      P3      P4      P5      P6             │
│   [✓]  → [✓]  → [◐]  → [ ○ ] → [ ○ ] → [ ○ ]           │
│   Auth    CRUD    PDF     Email   Dash    Ship            │
│                                                            │
│  BACKWARD <<<                                              │
│                                                            │
│    TDD ✓   HLD ✓   LLD ○   API ○   Sys ○   Run ○   Cap ○ │
│                                                            │
│  SYNC <><>                                                 │
│                                                            │
│    Last check: 2h ago │ Drift: 3 items │ Status: stale     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Current: Phase 3 — PDF Export (executing plan 2/3)

  Next:
    → /gtd-execute-phase 3   resume execution
    → /gtd-drift             check spec-code alignment
```

---

## Error & Warning Blocks

**Errors (something failed):**
```
  ✗ Phase 3 verification failed

    2 of 5 requirements not met:
      REQ-API-003   Endpoint returns 500 (expected 200)
      REQ-UI-007    Form validation missing

  Next:
    → /gtd-debug           auto-diagnose and fix
    → /gtd-execute-phase 3 re-run after manual fix
```

**Warnings (non-fatal):**
```
  ⚠ Context window at 35% remaining

    Consider saving your session:
    → /gtd-pause   save state and start fresh
```

**Info (neutral, informational):**
```
  ℹ Existing codebase detected (Next.js + Prisma + PostgreSQL)
    This will be a brownfield project — planning around your existing code.
```

---

## Confirmation Gates

When asking the user to approve something before proceeding:

```
  Here's what I'm working with:

    Vision       "Invoice management for freelancers"
    Core         CRUD + PDF export + recurring invoices
    Users        Solo freelancers, non-technical
    Stack        Next.js + Prisma (your preference)
    Constraints  Ship in 2 weeks, no budget for paid services

  Does this capture it? Anything to correct or add?
```

For requirement approval:
```
  Requirements extracted:

    v1 (must-have):
      REQ-AUTH-001   Email/password login
      REQ-AUTH-002   Session management
      REQ-INV-001    Create invoice
      REQ-INV-002    Edit invoice
      REQ-INV-003    PDF export
      ...8 more

    v2 (future):
      REQ-PAY-001    Stripe integration
      REQ-TEAM-001   Multi-user support
      ...6 more

    Out of scope:
      Mobile app, multi-currency, inventory

  Approve? (or tell me what to move between categories)
```

---

## Help & Command Lists

```
╭─ GTD Commands ────────────────────────────────────────────╮
│                                                            │
│  FORWARD >>>  (idea → code → deploy)                      │
│                                                            │
│    /gtd-new-project       initialize from idea             │
│    /gtd-discuss-phase N   shape implementation decisions   │
│    /gtd-plan-phase N      research + create plan           │
│    /gtd-execute-phase N   generate code                    │
│    /gtd-verify-work N     confirm it works                 │
│    /gtd-ship N            create PR                        │
│    /gtd-quick             ad-hoc task (no ceremony)        │
│    /gtd-fast              trivial inline task              │
│                                                            │
│  BACKWARD <<<  (code → documents)                         │
│                                                            │
│    /gtd-scan              map codebase                     │
│    /gtd-create-tdd        Technical Design Document        │
│    /gtd-create-all        all 7 documents                  │
│    /gtd-verify-docs       check accuracy                   │
│    /gtd-update-docs       incremental update               │
│                                                            │
│  SYNC <><>  (keep aligned)                                │
│                                                            │
│    /gtd-drift             detect spec ↔ code drift         │
│    /gtd-sync              auto-reconcile                   │
│                                                            │
│  UTILITY                                                   │
│                                                            │
│    /gtd-status            pipeline dashboard               │
│    /gtd-pause             save session state               │
│    /gtd-resume            restore session                  │
│    /gtd-help              this menu                        │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

---

## Conversational Responses (during questioning)

During interactive questioning (new-project, discuss-phase), output is NOT boxed.
It's conversational — like talking to a collaborator:

```
That sounds like a developer tool — a CLI that does one thing well.
Let me ask a few more things to make sure I get it right.

What's broken right now that makes you want this?
```

After the user answers:
```
Got it — manual CSV exports are slow and error-prone, and you want
a single command that pulls from the API and formats it.

Do you have a language preference for the CLI, or should I recommend one?
```

Rules for conversational output:
- No boxes, no tables, no decorations
- Short paragraphs (1-3 sentences max)
- React to what the user said before asking more
- Use their words back to them when confirming understanding

---

## Summary of When to Use What

| Context | Style |
|---------|-------|
| Command completion | Bordered block + Next steps |
| Long operation in progress | Progress indicators (✓/◐/○) |
| Status dashboard | Full bordered dashboard |
| Error/failure | Error block with diagnostic + next |
| Warning | Warning line with suggestion |
| Questioning / discussion | Plain conversational text |
| Confirmation gate | Indented key-value summary |
| Help menu | Bordered command list |

---

## Anti-Patterns (DO NOT)

- ❌ "I'm going to scan your codebase now..." (don't narrate intent, just do it)
- ❌ "Here are the results of the scan:" (don't announce, just show)
- ❌ Long paragraphs explaining what happened (use structured output)
- ❌ Repeating information the user already knows
- ❌ Box-drawing for every tiny output (reserve for key moments)
- ❌ Emoji in status indicators (use ✓/✗/◐/○ consistently, not 🎉✅❌)
