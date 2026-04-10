# Get Things Done (GTD) - Unified Vision Document

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft
**Codename:** Bidirectional Engineering Framework

---

## Table of Contents

- [1. The Vision](#1-the-vision)
- [2. The Problem Space](#2-the-problem-space)
- [3. The Three Modes](#3-the-three-modes)
- [4. Competitive Landscape](#4-competitive-landscape)
- [5. Unified Architecture](#5-unified-architecture)
- [6. Forward Pipeline — Ideation to Deploy](#6-forward-pipeline--ideation-to-deploy)
- [7. Backward Pipeline — Code to Documents](#7-backward-pipeline--code-to-documents)
- [8. Sync Mode — Bidirectional Reconciliation](#8-sync-mode--bidirectional-reconciliation)
- [9. Unified State Model](#9-unified-state-model)
- [10. Agent Roster — Complete](#10-agent-roster--complete)
- [11. Command Surface — Complete](#11-command-surface--complete)
- [12. User Journeys](#12-user-journeys)
- [13. Technical Differentiators](#13-technical-differentiators)
- [14. Naming and Branding](#14-naming-and-branding)
- [15. Package Structure](#15-package-structure)

---

## 1. The Vision

**Get Things Done (GTD)** is the first **bidirectional spec-driven agentic framework** for AI-assisted software development. It operates in three modes:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GET THINGS DONE                                 │
│                                                                         │
│   FORWARD MODE ►►►                                                      │
│   "I have an idea → build it for me"                                    │
│   Idea → Research → Spec → Plan → Code → Deploy → Test → Verify        │
│                                                                         │
│   BACKWARD MODE ◄◄◄                                                     │
│   "I have code → document it for me"                                    │
│   Code → Scan → Analyze → Draft → Verify → Finalize Documents          │
│                                                                         │
│   SYNC MODE ◄►◄►                                                        │
│   "Keep my specs and code in sync"                                      │
│   Detect Drift → Show Diff → Reconcile → Update Both Sides             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**One framework. One install. One `.planning/` directory. Both directions.**

---

## 2. The Problem Space

### The Forward Problem (Solved by GSD/BMAD, Improved by GTD)

Developers use AI coding assistants but get inconsistent results. Context rot degrades output quality. Requirements get lost. Plans don't match execution. No verification that what was built matches what was asked for.

### The Backward Problem (New — GTD's Innovation)

AI-generated codebases have no documentation. Brownfield projects acquired or inherited have stale docs. Compliance requirements demand current architecture docs. Nobody maintains documentation manually.

### The Sync Problem (Nobody Solves This — GTD's Killer Feature)

After building with GSD/BMAD, the specs used to generate the code are **immediately stale**. The AI made implementation decisions, took shortcuts, added error handling, chose patterns — none of which are reflected back in the specs. There's no tool that detects this drift and reconciles it.

```
Day 1:   Spec says "REST API with 5 endpoints"
         Code has: REST API with 5 endpoints ✓

Day 30:  Spec still says "REST API with 5 endpoints"
         Code now has: REST API with 12 endpoints, WebSocket, 3 background jobs
         DRIFT: spec is stale, nobody updated it ✗

GTD Sync: Detects drift → shows what changed → offers to update spec OR code
```

---

## 3. The Three Modes

### 3.1 Forward Mode — Ideation to Deployment

```
/gtd-new-project          → Dream extraction, research, requirements, roadmap
/gtd-discuss-phase N      → Lock in preferences for phase
/gtd-plan-phase N         → Research + create execution plan
/gtd-execute-phase N      → Parallel code generation with atomic commits
/gtd-verify-work N        → Automated + manual verification
/gtd-deploy-local         → Local deployment and testing
/gtd-test-phase N         → Run tests, validate behavior
/gtd-ship                 → Create PR / push
```

**Source of Truth:** `.planning/REQUIREMENTS.md`, `ROADMAP.md`, phase plans
**Direction:** Spec → Code
**Borrowed From:** GSD (fresh context, thin orchestrators, subagent model), BMAD (scale-adaptive, structured workflows)

### 3.2 Backward Mode — Code to Documents

```
/gtd-scan                 → Map codebase structure
/gtd-analyze              → Deep code analysis (6 dimensions)
/gtd-create-tdd           → Generate Technical Design Document
/gtd-create-hld           → Generate High-Level Design
/gtd-create-lld           → Generate Low-Level Design
/gtd-create-capacity      → Generate Capacity Plan
/gtd-create-sysdesign     → Generate System Design
/gtd-create-api-docs      → Generate API Documentation
/gtd-create-runbook       → Generate Operations Runbook
/gtd-create-all           → Generate full document suite
/gtd-verify-docs          → Accuracy verification against code
/gtd-update-docs          → Incremental document update
```

**Source of Truth:** The actual codebase
**Direction:** Code → Spec/Docs
**Innovation:** Accuracy verification, section-level incremental updates

### 3.3 Sync Mode — Bidirectional Reconciliation

```
/gtd-drift                → Detect spec ↔ code drift
/gtd-reconcile            → Show diff, propose updates to spec or code
/gtd-sync                 → Auto-reconcile (update specs to match code)
/gtd-audit                → Full alignment audit with report
```

**Source of Truth:** Both — code is reality, spec is intent
**Direction:** Bidirectional
**Innovation:** Nobody else does this. This is GTD's moat.

---

## 4. Competitive Landscape

```
                      Forward          Backward         Sync
                   (Spec → Code)    (Code → Docs)   (Both Ways)
                   ─────────────    ─────────────    ─────────────
GSD                    ████████         ░░░░░░░░        ░░░░░░░░
BMAD                   ████████         ░░░░░░░░        ░░░░░░░░
SpecKit                ████░░░░         ░░░░░░░░        ░░░░░░░░
Taskmaster             ██░░░░░░         ░░░░░░░░        ░░░░░░░░
JSDoc/Swagger          ░░░░░░░░         ██░░░░░░        ░░░░░░░░
Mintlify               ░░░░░░░░         ███░░░░░        ░░░░░░░░
───────────────────────────────────────────────────────────────────
GTD                    ████████         ████████        ████████
```

**GTD is the only framework that covers all three columns.**

---

## 5. Unified Architecture

### 5.1 System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          USER                                     │
│           /gtd-command [args]                                     │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                   COMMAND LAYER                                    │
│    commands/gtd/*.md — 40+ user-facing commands                   │
│    Forward: /gtd-new-project, /gtd-execute-phase, /gtd-deploy-*  │
│    Backward: /gtd-scan, /gtd-create-tdd, /gtd-create-all        │
│    Sync: /gtd-drift, /gtd-reconcile, /gtd-sync                  │
│    Utility: /gtd-help, /gtd-status, /gtd-settings               │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                  WORKFLOW LAYER                                    │
│    get-things-done/workflows/*.md — Thin orchestrators            │
│    Reads state → spawns agents → collects → routes → updates     │
└───────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
        │          │          │          │          │
   ┌────▼────┐ ┌───▼───┐ ┌───▼───┐ ┌───▼───┐ ┌───▼────┐
   │RESEARCH │ │ANALYZE│ │EXECUTE│ │ WRITE │ │VERIFY  │
   │ Agents  │ │Agents │ │Agents │ │Agents │ │Agents  │
   │(forward)│ │(back) │ │(fwd)  │ │(back) │ │(both)  │
   └────┬────┘ └───┬───┘ └───┬───┘ └───┬───┘ └───┬────┘
        │          │          │          │          │
┌───────▼──────────▼──────────▼──────────▼──────────▼──────────────┐
│                  CLI TOOLS LAYER                                   │
│    get-things-done/bin/gtd-tools.cjs                              │
│    State | Config | Phase | Analysis | Template | Docs | Roadmap  │
│    Deploy | Test | Verify | Diff | Sync                          │
└───────────────────────┬──────────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────┐
│                  FILE SYSTEM (.planning/)                          │
│                                                                   │
│  SHARED:        PROJECT.md | STATE.md | config.json               │
│  FORWARD:       REQUIREMENTS.md | ROADMAP.md | phases/            │
│  BACKWARD:      CODEBASE-MAP.md | analysis/ | documents/          │
│  SYNC:          DRIFT-REPORT.md | RECONCILIATION-LOG.md           │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Shared Infrastructure (~70% reuse)

The following components are **identical** for both forward and backward modes:

| Component | Usage |
|-----------|-------|
| `gtd-tools.cjs` | CLI tools layer (state, config, init) |
| `lib/config.cjs` | Configuration management |
| `lib/state.cjs` | State machine |
| `lib/file-ops.cjs` | Atomic writes, file utilities |
| `lib/frontmatter.cjs` | YAML frontmatter parser |
| `lib/security.cjs` | Secret scanning, sanitization |
| `bin/install.js` | Multi-runtime installer |
| Hooks system | Context monitor, status line, guards |
| Agent definition format | YAML frontmatter + Markdown prompt |
| Codebase scanner | Used by both forward (brownfield) and backward |
| Template engine | Used for plan templates AND document templates |
| Multi-runtime adapters | Identical installer for all modes |

### 5.3 Mode-Specific Components (~30% unique)

**Forward-only:**
- Research agents (project-researcher, phase-researcher)
- Planning agents (planner, plan-checker, roadmapper)
- Execution agents (executor)
- Deploy/test agents (deployer, test-runner)
- Phase management (phases/, plans, waves)
- Requirements tracking
- Roadmap management

**Backward-only:**
- Analysis agents (architecture-analyzer, api-extractor, pattern-detector, data-flow-tracer, dependency-analyzer, security-scanner, performance-profiler)
- Document writer agents (tdd-writer, hld-writer, lld-writer, etc.)
- Accuracy verifier
- Completeness auditor
- Diff engine for incremental updates

**Sync-only:**
- Drift detector agent
- Reconciliation agent
- Alignment auditor

---

## 6. Forward Pipeline — Ideation to Deploy

### 6.1 Pipeline Stages

```
Stage 1: IDEATION
  /gtd-new-project [--auto @idea.md]
  ├── Dream extraction (adaptive questioning)
  ├── Parallel research (4 agents: stack, features, architecture, pitfalls)
  ├── Research synthesis
  ├── Requirements extraction (v1 must-have, v2 future, out-of-scope)
  ├── Phased roadmap generation
  └── Output: PROJECT.md, REQUIREMENTS.md, ROADMAP.md, research/

Stage 2: DISCUSSION
  /gtd-discuss-phase N [--auto] [--batch]
  ├── Analyze phase scope, identify gray areas
  ├── Ask preference questions (visual, API, content, org decisions)
  ├── Code-aware scouting (read relevant existing files)
  └── Output: {phase}-CONTEXT.md

Stage 3: PLANNING
  /gtd-plan-phase N
  ├── Phase research (4 parallel researchers)
  ├── Plan creation (planner agent)
  ├── Plan verification (plan-checker agent)
  ├── Revision loop (up to 3 iterations)
  └── Output: {phase}-PLAN.md (or multiple plans for wave execution)

Stage 4: EXECUTION
  /gtd-execute-phase N [--wave W] [--autonomous]
  ├── Discover plans, analyze dependencies, group into waves
  ├── Spawn executor agents (parallel per wave)
  ├── Each executor: read plan → write code → commit → test → write SUMMARY.md
  ├── Integration checkpoint between waves
  └── Output: Committed code + SUMMARY.md per plan

Stage 5: VERIFICATION
  /gtd-verify-work N
  ├── Post-execution verification (verifier agent)
  ├── Test execution (run test suites)
  ├── Requirements traceability check
  ├── Cross-phase regression gate
  └── Output: VERIFICATION.md

Stage 6: LOCAL DEPLOY & TEST
  /gtd-deploy-local [--service name]
  ├── Detect deployment method (Docker, npm start, python run, etc.)
  ├── Build project
  ├── Start services locally
  ├── Health check endpoints
  ├── Run smoke tests
  └── Output: DEPLOY-REPORT.md

  /gtd-test-phase N [--e2e] [--integration] [--unit]
  ├── Discover test suites
  ├── Run targeted tests
  ├── Collect coverage report
  ├── Map failures to plan tasks
  └── Output: TEST-REPORT.md

Stage 7: SHIP
  /gtd-ship [--pr] [--merge]
  ├── Create PR with structured description
  ├── Link to requirements and phase
  └── Output: PR URL

Stage 8: MILESTONE
  /gtd-complete-milestone
  ├── Audit all phases complete
  ├── Archive milestone
  ├── Generate milestone summary
  └── Optionally: auto-trigger backward mode to generate fresh docs
```

### 6.2 Forward Pipeline Agents

| Agent | Role | Spawned By |
|-------|------|------------|
| `gtd-project-researcher` | Domain ecosystem research (×4 parallel) | `/gtd-new-project` |
| `gtd-research-synthesizer` | Combine research findings | `/gtd-new-project` |
| `gtd-roadmapper` | Create phased roadmap | `/gtd-new-project` |
| `gtd-phase-researcher` | Phase-specific research (×4) | `/gtd-plan-phase` |
| `gtd-planner` | Create detailed execution plan | `/gtd-plan-phase` |
| `gtd-plan-checker` | Verify plan quality | `/gtd-plan-phase` |
| `gtd-executor` | Execute plan tasks, write code | `/gtd-execute-phase` |
| `gtd-verifier` | Verify execution output | `/gtd-verify-work` |
| `gtd-deployer` | Local deployment orchestration | `/gtd-deploy-local` |
| `gtd-test-runner` | Test execution and reporting | `/gtd-test-phase` |
| `gtd-debugger` | Diagnose and fix failures | `/gtd-debug` |
| `gtd-code-reviewer` | Code quality review | `/gtd-review` |

---

## 7. Backward Pipeline — Code to Documents

### 7.1 Pipeline Stages

```
Stage 1: DISCOVERY
  /gtd-scan [--deep] [--include-tests]
  ├── File tree indexing (respect .gitignore + exclusions)
  ├── Language detection, framework fingerprinting
  ├── Entry point identification, module boundary mapping
  ├── Infrastructure detection (Docker, K8s, Terraform, CI/CD)
  ├── Database schema extraction
  └── Output: CODEBASE-MAP.md + analysis/FILE-INDEX.json

Stage 2: ANALYSIS
  /gtd-analyze [--focus dimension] [--force]
  ├── Architecture analysis (patterns, layers, components)
  ├── API surface extraction (endpoints, schemas, auth)
  ├── Pattern detection (design patterns, conventions)
  ├── Data flow tracing (request lifecycle, event propagation)
  ├── Dependency analysis (graph, versions, vulnerabilities)
  ├── Security surface mapping (auth, encryption, validation)
  ├── Performance profiling (caching, bottlenecks, scaling)
  └── Output: analysis/*.md (one per dimension)

Stage 3: GENERATION
  /gtd-create-<type> [--format enterprise|standard|startup|compliance]
  ├── Load analysis cache + document template
  ├── Spawn writer agent with focused context
  ├── Generate structured document following template
  ├── Embed Mermaid diagrams
  └── Output: documents/<TYPE>-DRAFT.md

Stage 4: VERIFICATION
  /gtd-verify-docs [document]
  ├── Cross-reference claims against actual code
  ├── Verify file paths, code snippets, config values
  ├── Check completeness against template
  └── Output: verification/<TYPE>-REPORT.md

Stage 5: FINALIZATION
  /gtd-review-docs [document]
  ├── Present draft + verification results to user
  ├── Collect feedback, apply revisions
  ├── Version stamp, move to final
  └── Output: documents/<TYPE>.md (final)
```

### 7.2 Backward Pipeline Agents

| Agent | Role | Spawned By |
|-------|------|------------|
| `gtd-codebase-mapper` | Scan and index project | `/gtd-scan` |
| `gtd-architecture-analyzer` | Architectural pattern analysis | `/gtd-analyze` |
| `gtd-api-extractor` | API endpoint extraction | `/gtd-analyze` |
| `gtd-pattern-detector` | Design pattern detection | `/gtd-analyze` |
| `gtd-data-flow-tracer` | Request lifecycle tracing | `/gtd-analyze` |
| `gtd-dependency-analyzer` | Dependency graph analysis | `/gtd-analyze` |
| `gtd-security-scanner` | Security surface mapping | `/gtd-analyze` |
| `gtd-performance-profiler` | Performance characterization | `/gtd-analyze` |
| `gtd-tdd-writer` | Technical Design Document | `/gtd-create-tdd` |
| `gtd-hld-writer` | High-Level Design | `/gtd-create-hld` |
| `gtd-lld-writer` | Low-Level Design | `/gtd-create-lld` |
| `gtd-capacity-writer` | Capacity Plan | `/gtd-create-capacity` |
| `gtd-sysdesign-writer` | System Design | `/gtd-create-sysdesign` |
| `gtd-api-doc-writer` | API Documentation | `/gtd-create-api-docs` |
| `gtd-runbook-writer` | Operations Runbook | `/gtd-create-runbook` |
| `gtd-accuracy-verifier` | Document accuracy check | `/gtd-verify-docs` |
| `gtd-completeness-auditor` | Document completeness check | `/gtd-verify-docs` |
| `gtd-diagram-generator` | Mermaid diagram creation | Writers on-demand |

---

## 8. Sync Mode — Bidirectional Reconciliation

### 8.1 The Drift Detection Problem

After forward engineering (spec → code), or after any code changes, specs and docs become stale:

```
DRIFT SOURCES:
  1. Forward drift: Code was generated but implementation diverged from spec
     - AI made optimization decisions not in the plan
     - Error handling added that spec didn't anticipate
     - Additional endpoints created for edge cases
     
  2. Evolutionary drift: Code changed after initial generation
     - Bug fixes that altered behavior
     - Feature additions not in original spec
     - Refactoring that changed architecture
     
  3. External drift: Dependencies or infrastructure changed
     - Framework upgrades altered patterns
     - New cloud services replaced old ones
     - Database migration changed schema
```

### 8.2 Sync Pipeline

```
Stage 1: DRIFT DETECTION
  /gtd-drift [--since commit] [--scope specs|docs|both]
  ├── Compare current code against last-known spec state
  ├── Run analysis diff: what does the code do NOW vs what spec says
  ├── Categorize drift:
  │   ├── ADDITION: code has something spec doesn't mention
  │   ├── REMOVAL: spec mentions something code doesn't have
  │   ├── MUTATION: both exist but behavior differs
  │   └── STRUCTURAL: architecture changed (pattern, layers, etc.)
  └── Output: DRIFT-REPORT.md with per-section drift analysis

Stage 2: RECONCILIATION
  /gtd-reconcile [--strategy spec-wins|code-wins|interactive]
  ├── For each drift item:
  │   ├── Show: "Spec says X, Code does Y"
  │   ├── Recommend: update spec (code-wins) or update code (spec-wins)
  │   └── Ask user: which direction?
  ├── Generate reconciliation plan
  └── Output: RECONCILIATION-PLAN.md

Stage 3: APPLY
  /gtd-sync [--auto] [--direction forward|backward|both]
  ├── If updating specs: regenerate affected spec sections
  ├── If updating code: create plan tasks for code changes
  ├── If updating docs: regenerate affected document sections
  └── Output: Updated .planning/ artifacts + optional code changes

Stage 4: AUDIT
  /gtd-audit [--compliance soc2|iso27001]
  ├── Full alignment check: spec ↔ code ↔ docs
  ├── Coverage matrix: which requirements are implemented, documented, tested
  ├── Gap analysis: undocumented code, unimplemented specs, untested features
  └── Output: AUDIT-REPORT.md with compliance status
```

### 8.3 Sync Agents

| Agent | Role | Spawned By |
|-------|------|------------|
| `gtd-drift-detector` | Compare spec/docs against code reality | `/gtd-drift` |
| `gtd-reconciliation-planner` | Generate reconciliation strategy | `/gtd-reconcile` |
| `gtd-alignment-auditor` | Full spec ↔ code ↔ docs audit | `/gtd-audit` |

---

## 9. Unified State Model

### 9.1 Combined State Machine

```
                    ┌──────────┐
                    │  EMPTY   │
                    └─────┬────┘
                          │ /gtd-new-project OR /gtd-scan
                ┌─────────┼─────────┐
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │   FORWARD    │    │   BACKWARD   │
        │   ACTIVE     │    │   ACTIVE     │
        │              │    │              │
        │ ┌──────────┐ │    │ ┌──────────┐ │
        │ │researched│ │    │ │ scanned  │ │
        │ │planned   │ │    │ │ analyzed │ │
        │ │executing │ │    │ │ drafting │ │
        │ │deployed  │ │    │ │ verified │ │
        │ │verified  │ │    │ │ finalized│ │
        │ └──────────┘ │    │ └──────────┘ │
        └──────┬───────┘    └──────┬───────┘
               │                   │
               └───────┬───────────┘
                       ▼
               ┌──────────────┐
               │   SYNCED     │
               │ (both sides  │
               │  aligned)    │
               └──────┬───────┘
                      │ code changes
                      ▼
               ┌──────────────┐
               │   DRIFTED    │
               │ (spec ≠ code │
               │  or docs ≠   │
               │  code)       │
               └──────────────┘
                      │ /gtd-sync
                      ▼
               ┌──────────────┐
               │   SYNCED     │
               └──────────────┘
```

### 9.2 Unified STATE.md

```markdown
---
mode: bidirectional
last_forward_action: execute-phase-3
last_backward_action: create-tdd
last_sync: 2026-04-10T14:30:00Z
drift_status: clean
---

# GTD State

## Forward Pipeline
- **Project:** My SaaS App
- **Current Phase:** 3 of 8
- **Phase Status:** executing (wave 2 of 3)
- **Milestone:** v1.0

## Backward Pipeline  
- **Last Scan:** 2026-04-10 @ abc1234
- **Analysis:** 6/6 dimensions current
- **Documents:**

| Document | Status | Version | Drift? |
|----------|--------|---------|--------|
| TDD | finalized | 1.1 | clean |
| HLD | finalized | 1.0 | stale (2 sections) |
| LLD | drafting | - | - |

## Sync Status
- **Last Drift Check:** 2026-04-10T14:30:00Z
- **Drift Items:** 0 (aligned)
- **Coverage:** 94% (requirements → code → docs)

## Metrics
- **Total Tokens:** 2.3M
- **Total Cost:** $12.45
- **Documents Generated:** 5
- **Phases Completed:** 2
```

---

## 10. Agent Roster — Complete

### 10.1 Full Agent Count: 33 Agents

**Forward Agents (12):**
| # | Agent | Category |
|---|-------|----------|
| 1 | `gtd-project-researcher` | Research |
| 2 | `gtd-phase-researcher` | Research |
| 3 | `gtd-research-synthesizer` | Research |
| 4 | `gtd-roadmapper` | Planning |
| 5 | `gtd-planner` | Planning |
| 6 | `gtd-plan-checker` | Verification |
| 7 | `gtd-executor` | Execution |
| 8 | `gtd-verifier` | Verification |
| 9 | `gtd-deployer` | Deploy |
| 10 | `gtd-test-runner` | Testing |
| 11 | `gtd-debugger` | Debug |
| 12 | `gtd-code-reviewer` | Review |

**Backward Agents (18):**
| # | Agent | Category |
|---|-------|----------|
| 13 | `gtd-codebase-mapper` | Discovery |
| 14 | `gtd-architecture-analyzer` | Analysis |
| 15 | `gtd-api-extractor` | Analysis |
| 16 | `gtd-pattern-detector` | Analysis |
| 17 | `gtd-data-flow-tracer` | Analysis |
| 18 | `gtd-dependency-analyzer` | Analysis |
| 19 | `gtd-security-scanner` | Analysis |
| 20 | `gtd-performance-profiler` | Analysis |
| 21 | `gtd-tdd-writer` | Writing |
| 22 | `gtd-hld-writer` | Writing |
| 23 | `gtd-lld-writer` | Writing |
| 24 | `gtd-capacity-writer` | Writing |
| 25 | `gtd-sysdesign-writer` | Writing |
| 26 | `gtd-api-doc-writer` | Writing |
| 27 | `gtd-runbook-writer` | Writing |
| 28 | `gtd-accuracy-verifier` | Verification |
| 29 | `gtd-completeness-auditor` | Verification |
| 30 | `gtd-diagram-generator` | Utility |

**Sync Agents (3):**
| # | Agent | Category |
|---|-------|----------|
| 31 | `gtd-drift-detector` | Sync |
| 32 | `gtd-reconciliation-planner` | Sync |
| 33 | `gtd-alignment-auditor` | Sync |

---

## 11. Command Surface — Complete

### 11.1 All Commands (42 total)

**Forward Commands (18):**
```
/gtd-new-project [--auto @file]     Initialize project from idea
/gtd-discuss-phase N [--auto]       Lock in phase preferences
/gtd-plan-phase N                   Research + plan phase
/gtd-execute-phase N [--wave W]     Execute phase plans
/gtd-verify-work N                  Verify execution output
/gtd-deploy-local [--service]       Deploy locally
/gtd-test-phase N [--e2e]           Run tests
/gtd-ship [--pr]                    Create PR / push
/gtd-new-milestone                  Start new milestone
/gtd-complete-milestone             Close milestone
/gtd-next                           Auto-advance to next step
/gtd-autonomous N [--to M]          Run phases N through M unattended
/gtd-quick <task>                   Quick one-off task
/gtd-debug [--diagnose]             Debug issues
/gtd-code-review                    Review code quality
/gtd-add-phase <desc>               Add new phase to roadmap
/gtd-progress                       Show forward pipeline progress
/gtd-fast <task>                    Fast mode (skip research)
```

**Backward Commands (15):**
```
/gtd-scan [--deep]                  Map codebase
/gtd-analyze [--focus dim]          Deep code analysis
/gtd-create-tdd [--format fmt]      Generate Technical Design Doc
/gtd-create-hld [--format fmt]      Generate High-Level Design
/gtd-create-lld [--module name]     Generate Low-Level Design
/gtd-create-capacity                Generate Capacity Plan
/gtd-create-sysdesign               Generate System Design
/gtd-create-api-docs [--openapi]    Generate API Documentation
/gtd-create-runbook                 Generate Operations Runbook
/gtd-create-all [--parallel]        Generate full document suite
/gtd-verify-docs [type]             Verify document accuracy
/gtd-review-docs [type]             Review with feedback
/gtd-update-docs [--since commit]   Incremental document update
/gtd-diff [--doc type]              Show code↔doc diff
/gtd-doc-status                     Document pipeline status
```

**Sync Commands (4):**
```
/gtd-drift [--since commit]         Detect spec ↔ code drift
/gtd-reconcile [--strategy str]     Plan reconciliation
/gtd-sync [--auto] [--direction]    Apply reconciliation
/gtd-audit [--compliance type]      Full alignment audit
```

**Utility Commands (5):**
```
/gtd-help                           Contextual help
/gtd-status                         Overall pipeline status (all modes)
/gtd-settings                       Configuration management
/gtd-health                         Framework health check
/gtd-map-codebase                   Codebase mapping (for brownfield forward)
```

---

## 12. User Journeys

### Journey 1: Greenfield — Build from Scratch

```
Developer: "I want to build a SaaS invoicing app"

/gtd-new-project → Questions → Research → Requirements → Roadmap
/gtd-discuss-phase 1 → Lock in preferences for auth phase
/gtd-plan-phase 1 → Research + detailed plan
/gtd-execute-phase 1 → Code generated + committed
/gtd-deploy-local → App running on localhost:3000
/gtd-test-phase 1 → All tests pass
/gtd-verify-work 1 → Requirements met ✓
/gtd-ship → PR created

... repeat for phases 2-8 ...

/gtd-complete-milestone → v1.0 done!
/gtd-create-all → Generate all 7 technical documents
/gtd-sync → Specs and docs fully aligned with code ✓
```

### Journey 2: Brownfield — Document Existing Code

```
Developer: "I inherited this codebase, need docs for audit"

/gtd-scan → Mapped: 234 files, Next.js + FastAPI monorepo
/gtd-create-all --format compliance → All 7 docs generated
/gtd-verify-docs → 96% accuracy score
/gtd-review-docs → Minor fixes applied
→ SOC2-ready documentation in 40 minutes
```

### Journey 3: Hybrid — Continue Building + Keep Docs Updated

```
Developer: Building with GTD forward, wants docs to stay current

/gtd-execute-phase 5 → New code generated
/gtd-drift → "3 drift items detected: 2 new endpoints, 1 config change"
/gtd-sync --auto → Specs and docs updated automatically
→ Code, specs, and docs always aligned
```

### Journey 4: Bidirectional from Day One

```
Developer: "I want to build AND document as I go"

/gtd-new-project → Project initialized
/gtd-settings → Set: auto_doc_generation: true

Now after every /gtd-execute-phase:
  → Code generated
  → Forward verification runs
  → Backward analysis auto-updates
  → Documents auto-regenerated for changed areas
  → Drift auto-reconciled
  
Everything stays in sync automatically.
```

---

## 13. Technical Differentiators

| Feature | GSD | BMAD | GTD |
|---------|-----|------|-----|
| Forward pipeline (spec → code) | ✅ | ✅ | ✅ |
| Backward pipeline (code → docs) | ❌ | ❌ | ✅ |
| Bidirectional sync | ❌ | ❌ | ✅ |
| Local deploy + test | ❌ | ❌ | ✅ |
| Fresh context per agent | ✅ | ❌ | ✅ |
| Document accuracy verification | ❌ | ❌ | ✅ |
| Incremental doc updates | ❌ | ❌ | ✅ |
| Drift detection | ❌ | ❌ | ✅ |
| Scale-adaptive intelligence | ❌ | ✅ | ✅ |
| Multi-runtime support | ✅ (12) | ✅ (2) | ✅ (9+) |
| SDK for CI/CD | ✅ | ❌ | ✅ |
| Compliance document formats | ❌ | ❌ | ✅ |
| 33 specialized agents | 24 | 12+ | 33 |
| 42 commands | 69 | 34+ | 42 |

---

## 14. Naming and Branding

```
Package name:     get-things-done
npm:              npx get-things-done@latest
Command prefix:   /gtd-*
Planning dir:     .planning/
Config dir:       get-things-done/
State file:       .planning/STATE.md
Brand position:   "The complete AI development lifecycle"
Tagline:          "Forward. Backward. In Sync."
```

### Name Rationale

| Candidate | Pros | Cons | Verdict |
|-----------|------|------|---------|
| get-things-done | Superset of GSD/GDD, clear purpose | GTD conflicts with "Getting Things Done" (productivity method) | ✅ Best — the productivity association is actually positive |
| get-documents-done | Backward only | Doesn't cover forward | ❌ Too narrow |
| get-stuff-done | Clean, generic | Too close to GSD | ❌ Confusion |
| get-things-done | Complete lifecycle | None significant | ✅ Selected |

---

## 15. Package Structure

```
get-things-done/
├── bin/
│   ├── install.js                    # npx entry point
│   └── gtd-tools.cjs                # CLI tools (unified)
├── lib/                              # Shared infrastructure
│   ├── init.cjs
│   ├── config.cjs
│   ├── state.cjs
│   ├── analysis.cjs
│   ├── template.cjs
│   ├── docs.cjs
│   ├── phase.cjs                     # Forward: phase management
│   ├── roadmap.cjs                   # Forward: roadmap management
│   ├── deploy.cjs                    # Forward: local deploy
│   ├── diff-engine.cjs               # Backward: change detection
│   ├── drift-engine.cjs              # Sync: drift detection
│   ├── file-ops.cjs
│   ├── frontmatter.cjs
│   ├── security.cjs
│   └── installers/                   # Multi-runtime installers
├── agents/                           # All 33 agent definitions
│   ├── forward/                      # 12 forward agents
│   ├── backward/                     # 18 backward agents
│   └── sync/                         # 3 sync agents
├── commands/gtd/                     # All 42 commands
│   ├── forward/                      # 18 forward commands
│   ├── backward/                     # 15 backward commands
│   ├── sync/                         # 4 sync commands
│   └── utility/                      # 5 utility commands
├── workflows/                        # Orchestration logic
│   ├── forward/
│   ├── backward/
│   └── sync/
├── references/                       # Shared knowledge
├── templates/
│   ├── forward/                      # Plan, phase, project templates
│   └── backward/                     # Document templates (TDD, HLD, etc.)
├── contexts/
├── hooks/
├── sdk/
└── tests/
```

---

*End of Unified Vision Document*
