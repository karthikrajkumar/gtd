# GTD v2.0 Implementation Plan

> Upgrade GTD to GSD/BMAD feature parity with polished, rendered output.
> Based on: `docs/COMPETITIVE-ANALYSIS.md`
> Status: PLANNING (do not implement yet)

---

## Overview

Three implementation milestones, each independently releasable:

| Milestone | Theme | New Commands | New Agents | New Workflows | Target Version |
|---|---|---|---|---|---|
| M1 | Session, Quick/Fast, Ship | 8 | 6 | 6 | v2.0.0 |
| M2 | Experimentation, Observability, Backlog | 15 | 5 | 10 | v2.1.0 |
| M3 | Ecosystem, Personas, Agile | 8+ | 4+ | 6+ | v3.0.0 |

---

## Rendering & Output Quality

### The Problem

GSD and BMAD output feels polished. GTD output feels like debug logs.

**GSD example (how their commands render):**
```
┌────────────────────────────────────────────────────────────┐
│  PHASE EXECUTION                                           │
├────────────────────────────────────────────────────────────┤
│  WAVE 1 (parallel)       WAVE 2 (parallel)     WAVE 3     │
│  ┌─────────┐ ┌─────────┐  ┌─────────┐          ┌───────┐ │
│  │ Plan 01 │ │ Plan 02 │  │ Plan 03 │          │Plan 05│ │
│  └─────────┘ └─────────┘  └─────────┘          └───────┘ │
└────────────────────────────────────────────────────────────┘
```

**GTD current output:**
```
✓ Project initialized!

  Project: {name}
  Requirements: {v1_count} v1, {v2_count} v2
  Phases: {count} (granularity: {setting})
```

### The Fix: Output Design System

Create a `references/output-style.md` that ALL workflows and commands reference. It defines:

#### 1. Status Blocks (success, progress, error)

```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Project initialized                                    │
│                                                            │
│  Project    my-saas-app                                    │
│  Vision     "Invoice management for freelancers"           │
│  Stack      Next.js + Prisma + PostgreSQL                  │
│                                                            │
│  Requirements                                              │
│    v1 (must-have)    12 items                              │
│    v2 (future)        8 items                              │
│    out of scope       5 items                              │
│                                                            │
│  Phases     6 (standard granularity)                       │
│  Research   ✓ complete (4 agents, 12s)                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

#### 2. Progress Indicators (during long operations)

```
  ◐ Researching...  [████████░░░░░░░░]  2/4 agents complete

  ✓ STACK research       (3.2s)
  ✓ FEATURES research    (4.1s)
  ◐ ARCHITECTURE         running...
  ○ PITFALLS             queued
```

#### 3. Pipeline Dashboard (status command)

```
╭─ GTD Pipeline Status ─────────────────────────────────────╮
│                                                            │
│  FORWARD >>>                                               │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐         │
│  │ P1 │→ │ P2 │→ │ P3 │→ │ P4 │→ │ P5 │→ │ P6 │         │
│  │ ✓  │  │ ✓  │  │ ◐  │  │ ○  │  │ ○  │  │ ○  │         │
│  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘         │
│                                                            │
│  BACKWARD <<<                                              │
│  TDD ✓  HLD ✓  LLD ○  API ○  Sys ○  Run ○  Cap ○        │
│                                                            │
│  SYNC <><>                                                 │
│  Last drift check: 2h ago │ 3 items drifted               │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

#### 4. Next Steps (always show what to do next)

```
  Next steps:
    → /gtd-discuss-phase 3   shape implementation preferences
    → /gtd-plan-phase 3      skip discussion, go to planning
    → /gtd-quick             quick ad-hoc task
```

#### 5. Table Formatting (for lists)

```
  ┌─────────────────────────────────────────────────────────┐
  │ #  │ Requirement              │ Phase │ Status          │
  ├────┼──────────────────────────┼───────┼─────────────────┤
  │ 1  │ User authentication      │ P1    │ ✓ implemented   │
  │ 2  │ Invoice CRUD             │ P2    │ ✓ implemented   │
  │ 3  │ PDF export               │ P3    │ ◐ in progress   │
  │ 4  │ Email notifications      │ P4    │ ○ planned       │
  └────┴──────────────────────────┴───────┴─────────────────┘
```

#### 6. Warning & Error Blocks

```
  ⚠ Context window at 38% remaining
    Consider: /gtd-pause to save state and start fresh

  ✗ Phase 3 verification failed
    2 of 5 requirements not met:
      REQ-API-003: Endpoint returns 500 (expected 200)
      REQ-UI-007: Form validation missing
    
    → /gtd-debug (auto-diagnose and fix)
```

### Implementation

- Create `references/output-style.md` — the design system (referenced by all workflows)
- Update every workflow's `Display:` blocks to use the new formatting
- The rendering is done by the AI agent reading the style reference — no code change needed, only prompt changes

---

## Milestone 1: Session, Quick/Fast, Ship (v2.0.0)

### Wave 1.1 — Session Management

| Deliverable | File | Description |
|---|---|---|
| Agent | `agents/utility/gtd-session-manager.md` | Serialize/restore state across context windows |
| Command | `commands/gtd/session/pause.md` | Create HANDOFF.json |
| Command | `commands/gtd/session/resume.md` | Restore from HANDOFF.json |
| Command | `commands/gtd/session/report.md` | Session summary |
| Workflow | `workflows/session/pause.md` | Full pause orchestration |
| Workflow | `workflows/session/resume.md` | Full resume orchestration |
| Lib module | `lib/session.cjs` | Serialize/deserialize logic |
| Reference | `references/output-style.md` | Rendering design system |

**HANDOFF.json spec:**
```json
{
  "version": "1.0",
  "timestamp": "2026-05-06T12:00:00Z",
  "phase": 3,
  "step": "execute",
  "plan_index": 2,
  "decisions": ["Used PostgreSQL", "Card layout for dashboard"],
  "blockers": [],
  "context_summary": "Phase 3 execution in progress. Plans 1-2 complete, plan 3 pending.",
  "files_modified_this_session": ["src/api/invoices.ts", "src/components/Dashboard.tsx"],
  "next_action": "/gtd-execute-phase 3 (resume from plan 3)"
}
```

### Wave 1.2 — Quick & Fast Modes

| Deliverable | File | Description |
|---|---|---|
| Agent | `agents/forward/gtd-quick-planner.md` | Lightweight planner (no research by default) |
| Agent | `agents/forward/gtd-fast-executor.md` | Inline trivial task execution |
| Command | `commands/gtd/forward/quick.md` | Ad-hoc task with GTD guarantees |
| Command | `commands/gtd/forward/fast.md` | Trivial tasks, skip planning |
| Workflow | `workflows/forward/quick.md` | Quick pipeline (discuss? → plan → execute → verify?) |
| Workflow | `workflows/forward/fast.md` | Inline execution |

**Quick mode flags:**
- `--discuss` — lightweight gray-area surfacing first
- `--research` — spawn focused researcher before planning
- `--validate` — plan-check + post-execution verification
- `--full` — all of the above (discuss + research + validate)
- No flags = plan + execute only (the fast default)

**Fast mode behavior:**
- User describes task in natural language
- No planning file written
- Execute immediately
- Atomic commit
- Lives in `.planning/quick/NNN-{slug}/SUMMARY.md`

### Wave 1.3 — Ship & PR Workflow

| Deliverable | File | Description |
|---|---|---|
| Agent | `agents/forward/gtd-pr-creator.md` | Generate PR title/body from phase summaries |
| Command | `commands/gtd/forward/ship.md` | Create PR from verified work |
| Workflow | `workflows/forward/ship.md` | PR creation orchestration |
| Lib module | `lib/pr-builder.cjs` | PR body generation logic |

**Ship workflow:**
1. Check phase is verified (or warn if not)
2. Create branch if not on one (configurable strategy)
3. Filter `.planning/` commits if `--clean` flag
4. Generate PR title from phase name
5. Generate PR body from SUMMARY.md files
6. Create PR via `gh pr create` (or output the command if `gh` unavailable)
7. Support `--draft` for draft PRs

### Wave 1.4 — Security & Ingest

| Deliverable | File | Description |
|---|---|---|
| Agent | `agents/forward/gtd-security-enforcer.md` | Threat-model-anchored verification |
| Agent | `agents/backward/gtd-doc-ingester.md` | Classify and merge external docs |
| Command | `commands/gtd/forward/secure-phase.md` | Security audit |
| Command | `commands/gtd/backward/ingest-docs.md` | External doc ingestion |
| Workflow | `workflows/forward/secure-phase.md` | Security verification pipeline |
| Workflow | `workflows/backward/ingest-docs.md` | Classify → merge → report |
| Lib module | `lib/ingest.cjs` | Document classification logic |

### Wave 1.5 — Model Profiles & Installer Updates

| Deliverable | File | Description |
|---|---|---|
| Config schema update | `lib/config.cjs` | Add `model_profile` field |
| Command update | `commands/gtd/utility/settings.md` | Add profile switching |
| Installer update | `lib/installer-core.cjs` | Add `--uninstall` flag |
| Installer update | `lib/installer-core.cjs` | Add `--minimal` flag |

**Model profiles:**
```json
{
  "model_profile": "balanced",
  "profiles": {
    "quality":  { "planning": "opus", "execution": "opus", "verification": "sonnet" },
    "balanced": { "planning": "opus", "execution": "sonnet", "verification": "sonnet" },
    "budget":   { "planning": "sonnet", "execution": "sonnet", "verification": "haiku" },
    "inherit":  { "planning": "inherit", "execution": "inherit", "verification": "inherit" }
  }
}
```

---

## Milestone 2: Experimentation & Observability (v2.1.0)

### Wave 2.1 — Spike & Sketch

| Deliverable | File |
|---|---|
| Agent | `agents/forward/gtd-spike-runner.md` |
| Agent | `agents/forward/gtd-sketch-designer.md` |
| Command | `commands/gtd/forward/spike.md` |
| Command | `commands/gtd/forward/sketch.md` |
| Command | `commands/gtd/forward/spike-wrap-up.md` |
| Command | `commands/gtd/forward/sketch-wrap-up.md` |
| Workflow | `workflows/forward/spike.md` |
| Workflow | `workflows/forward/sketch.md` |

**Spike output:** `.planning/spikes/NNN-{slug}/` with Given/When/Then verdicts per experiment.

**Sketch output:** `.planning/sketches/NNN-{slug}/` with 2-3 HTML mockup files + comparison notes.

### Wave 2.2 — UI Design

| Deliverable | File |
|---|---|
| Agent | `agents/forward/gtd-ui-spec-writer.md` |
| Agent | `agents/forward/gtd-ui-reviewer.md` |
| Command | `commands/gtd/forward/ui-phase.md` |
| Command | `commands/gtd/forward/ui-review.md` |
| Workflow | `workflows/forward/ui-phase.md` |
| Workflow | `workflows/forward/ui-review.md` |

### Wave 2.3 — Observability

| Deliverable | File |
|---|---|
| Agent | `agents/utility/gtd-forensics-investigator.md` |
| Command | `commands/gtd/utility/stats.md` |
| Command | `commands/gtd/utility/forensics.md` |
| Command | `commands/gtd/forward/audit-uat.md` |
| Command | `commands/gtd/forward/audit-milestone.md` |
| Command | `commands/gtd/forward/milestone-summary.md` |
| Workflow | `workflows/utility/stats.md` |
| Workflow | `workflows/utility/forensics.md` |
| Workflow | `workflows/forward/audit-uat.md` |
| Workflow | `workflows/forward/audit-milestone.md` |
| Workflow | `workflows/forward/milestone-summary.md` |

### Wave 2.4 — Backlog & Threads

| Deliverable | File |
|---|---|
| Command | `commands/gtd/backlog/plant-seed.md` |
| Command | `commands/gtd/backlog/add-backlog.md` |
| Command | `commands/gtd/backlog/review-backlog.md` |
| Command | `commands/gtd/session/thread.md` |
| Workflow | `workflows/session/thread.md` |
| Lib module | `lib/backlog.cjs` |

**New `.planning/` directories:**
- `.planning/todos/` — captured ideas
- `.planning/threads/` — persistent context threads
- `.planning/seeds/` — forward-looking ideas with trigger conditions
- `.planning/spikes/` — spike experiment results
- `.planning/sketches/` — sketch mockup results
- `.planning/quick/` — quick task results

### Wave 2.5 — Infrastructure

| Item | Description |
|---|---|
| `--chain` flag on discuss | Auto-chain discuss → plan → execute |
| `--batch` flag on discuss | Answer grouped questions at once |
| Git branching strategies | `none` / `phase` / `milestone` in config |
| Workstreams | `commands/gtd/forward/workstreams.md` (list/create/switch/complete) |
| 5 new runtimes | Kilo, Antigravity, Trae, Qwen Code, CodeBuddy installers |

---

## Milestone 3: Beyond Parity (v3.0.0)

### Wave 3.1 — Module Ecosystem

- Module loader in `lib/modules.cjs`
- `gtd-module-install` command
- Module manifest format (like BMAD's module system)
- First-party modules: Test Architect, UI Kit, Game Dev

### Wave 3.2 — Named Personas (optional)

- Persona layer on top of existing agents
- `/gtd-settings --personas on` to enable
- Personas: "Research Lead", "Architect", "Builder", "Reviewer"
- Changes agent communication style, not behavior

### Wave 3.3 — Agile Mapping

- Epic/Story view of existing phases/plans
- Sprint planning workflow
- Retrospective workflow

---

## File Count Summary

| Category | Current | After M1 | After M2 | After M3 |
|---|---|---|---|---|
| Agents | 33 | 39 (+6) | 44 (+5) | 48 (+4) |
| Commands | 40 | 48 (+8) | 63 (+15) | 71 (+8) |
| Workflows | 29 | 35 (+6) | 45 (+10) | 51 (+6) |
| Lib modules | 29 | 32 (+3) | 33 (+1) | 35 (+2) |
| References | 11 | 12 (+1) | 12 | 12 |
| Hooks | 4 | 4 | 4 | 4 |
| Runtimes | 9 | 9 | 14 (+5) | 14 |

---

## Implementation Order (recommended)

```
Week 1:  references/output-style.md (rendering design system)
         Update all existing Display: blocks to new style
         
Week 2:  /gtd-pause, /gtd-resume (session management)
         lib/session.cjs
         
Week 3:  /gtd-quick, /gtd-fast (lighter execution paths)
         
Week 4:  /gtd-ship (PR workflow)
         --uninstall flag
         
Week 5:  /gtd-secure-phase, /gtd-ingest-docs
         Model profiles
         --minimal flag

Week 6:  Testing, integration, release v2.0.0
```

---

## Questions to Decide Before Implementation

1. **Command naming:** Keep `/gtd-` prefix for all new commands, or introduce sub-categories like `/gtd session pause`?
2. **Backlog location:** Under `commands/gtd/backlog/` or `commands/gtd/utility/`?
3. **Quick mode output:** Store in `.planning/quick/` (like GSD) or a flatter structure?
4. **Persona mode:** Worth building in M2 instead of M3?
5. **Rendering:** Should output-style.md use Unicode box-drawing everywhere, or only for key moments (status, completion)?

---

*This plan is ready for review. Say "go" to start implementation from Wave 1.1.*
