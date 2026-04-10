# Get Things Done (GTD) - High-Level Design Document

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft

---

## Table of Contents

- [1. System Context](#1-system-context)
- [2. Architecture Overview](#2-architecture-overview)
- [3. Major Subsystems](#3-major-subsystems)
- [4. User Workflows](#4-user-workflows)
- [5. Data Architecture](#5-data-architecture)
- [6. Integration Points](#6-integration-points)
- [7. Cross-Cutting Concerns](#7-cross-cutting-concerns)
- [8. Deployment Model](#8-deployment-model)
- [9. Key Design Decisions](#9-key-design-decisions)

---

## 1. System Context

### 1.1 Context Diagram

```
                    ┌─────────────────────────┐
                    │      Developer           │
                    │  (runs /gtd-* commands)  │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────────┐
                    │    AI Coding Runtime      │
                    │  (Claude Code, Cursor,    │
                    │   Gemini CLI, etc.)       │
                    └───────────┬──────────────┘
                                │
        ┌───────────────────────▼───────────────────────────┐
        │                  GET THINGS DONE                   │
        │                                                    │
        │  ┌───────────────────────────────────────────┐    │
        │  │          FORWARD PIPELINE (→)              │    │
        │  │  Idea → Research → Plan → Execute → Deploy │    │
        │  │  AI generates code, deploys locally,       │    │
        │  │  runs tests                                │    │
        │  └───────────────────────────────────────────┘    │
        │                                                    │
        │  ┌───────────────────────────────────────────┐    │
        │  │          BACKWARD PIPELINE (←)             │    │
        │  │  Code → Analyze → Generate Docs → Verify   │    │
        │  └───────────────────────────────────────────┘    │
        │                                                    │
        │  ┌───────────────────────────────────────────┐    │
        │  │          SYNC PIPELINE (↔)                 │    │
        │  │  Drift Detection → Reconciliation          │    │
        │  │  Keeps spec and code in agreement          │    │
        │  └───────────────────────────────────────────┘    │
        │                                                    │
        │  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
        │  │ Command  │  │ Workflow │  │    Agent      │    │
        │  │  Layer   │─>│  Layer   │─>│  Orchestration│    │
        │  └──────────┘  └──────────┘  └──────────────┘    │
        │                                     │             │
        │  ┌──────────┐  ┌──────────┐  ┌──────▼───────┐    │
        │  │ Template │  │  State   │  │  CLI Tools   │    │
        │  │  Engine  │  │ Manager  │  │    Layer     │    │
        │  └──────────┘  └──────────┘  └──────────────┘    │
        └───────────┬──────────────┬────────────────────────┘
                    │              │
        ┌───────────▼──┐  ┌───────▼──────────┐
        │  Codebase    │  │  .planning/      │
        │  (source     │  │ (analysis cache, │
        │   code)      │  │  generated docs, │
        │              │  │  plans, specs)   │
        └──────────────┘  └──────────────────┘
```

### 1.2 Actors

| Actor | Description | Interaction |
|-------|-------------|-------------|
| **Developer** | Primary user who builds software and needs documentation | Runs `/gtd-*` commands, reviews drafts, provides feedback |
| **AI Runtime** | The coding assistant (Claude Code, etc.) | Interprets commands, spawns agents, manages context |
| **AI Forward Agents** | Specialized agents for code generation | Research topics, plan phases, generate code, deploy locally, run tests |
| **AI Backward Agents** | Specialized agents for documentation | Analyze code, write documents, verify accuracy |
| **AI Sync Agents** | Specialized agents for consistency | Detect drift between spec and code, plan reconciliation |
| **CI/CD Pipeline** | Automated pipeline for doc generation | Uses GTD SDK for headless execution |
| **Team Members** | Consumers of generated documentation | Read final documents, provide review comments |

### 1.3 External Systems

| System | Interaction | Protocol |
|--------|-------------|----------|
| Git | Version tracking, change detection | CLI (`git log`, `git diff`) |
| npm Registry | Framework distribution | `npx get-things-done@latest` |
| File System | Source code reading, doc output, local deploy | Node.js `fs` API |
| Web (optional) | Framework/library documentation lookup | HTTP (via agent web search) |
| Local Runtime | Local deployment target for forward pipeline | Process spawn, HTTP health checks |
| Test Runners | Test execution for forward pipeline | CLI (jest, pytest, go test, etc.) |

---

## 2. Architecture Overview

### 2.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: PRESENTATION                                        │
│                                                              │
│   Forward Commands:                                          │
│     /gtd-new-project, /gtd-plan-phase, /gtd-execute-phase,  │
│     /gtd-deploy-local, /gtd-run-tests                       │
│   Backward Commands:                                         │
│     /gtd-scan, /gtd-analyze, /gtd-create-*, /gtd-update     │
│   Sync Commands:                                             │
│     /gtd-check-drift, /gtd-reconcile, /gtd-sync             │
│   Status UI — Progress display and dashboards                │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: ORCHESTRATION                                       │
│                                                              │
│   Forward Workflows:                                         │
│     new-project, plan-phase, execute-phase, deploy-local     │
│   Backward Workflows:                                        │
│     scan, analyze, create-document, update-document          │
│   Sync Workflows:                                            │
│     drift-check, reconcile, full-sync                        │
│   Agent Spawning — Fresh context, parallel/sequential        │
│   Gate System — Quality and approval checkpoints             │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: INTELLIGENCE                                        │
│                                                              │
│   Forward Agents:                                            │
│     Researchers — Domain/tech research specialists            │
│     Planner — Phase decomposition and task planning           │
│     Executor — Code generation via wave-based parallelism     │
│     Deployer — Local deployment and environment setup         │
│     Test Runner — Test execution and result analysis           │
│   Backward Agents:                                           │
│     Analyzers — Code understanding specialists                │
│     Writers — Document generation specialists                 │
│     Verifiers — Accuracy and completeness checking            │
│   Sync Agents:                                               │
│     Drift Detector — Spec-to-code comparison                  │
│     Reconciliation Planner — Strategy selection and execution │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: SERVICES                                            │
│   CLI Tools (gtd-tools.cjs) — State, config, templates       │
│   Analysis Cache — Persisted analysis results                │
│   Template Engine — Document template processing             │
│   Diff Engine — Incremental change detection                 │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: FOUNDATION                                          │
│   File System — Source reading, doc writing                   │
│   Git Integration — Change tracking, versioning              │
│   Runtime Abstraction — Multi-IDE compatibility              │
│   Installer — npx-based setup and update                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Key Architectural Patterns

| Pattern | Usage |
|---------|-------|
| **Bidirectional Pipeline** | Forward: Research → Plan → Execute → Deploy → Test; Backward: Scan → Analyze → Generate → Verify → Finalize |
| **Fan-out/Fan-in** | Parallel analyzer agents, parallel executor agents, collected by orchestrator |
| **Fresh Context** | Each agent spawns with clean context window (no rot) |
| **File-based Messaging** | Agents communicate via Markdown artifacts on disk |
| **Event Sourcing** | STATE.md tracks all pipeline events for resume capability |
| **Template Method** | Document writers follow template structure, fill with analysis |
| **Strategy** | Different analysis strategies per language/framework; different reconciliation strategies (spec-wins, code-wins, interactive) |
| **Wave-based Parallelism** | Executor agents work in dependency-ordered waves for code generation |
| **Drift Detection** | Continuous comparison between spec artifacts and generated code |

---

## 3. Major Subsystems

### 3.1 Installer Subsystem

**Purpose:** Install GTD into any project for any supported AI runtime.

```
bin/install.js
├── Runtime Detection    — Which AI tools are installed?
├── Location Selection   — Global (~/) or Local (./)
├── File Copy           — Commands, workflows, agents, templates
├── Config Generation   — Initial config.json
├── Hook Setup          — Runtime-specific hooks
└── Verification        — Post-install health check
```

**Key Behaviors:**
- Interactive mode with prompts for runtime and location
- Non-interactive mode with flags (`--claude --global`)
- Multi-runtime support (install for multiple IDEs at once)
- Update detection (compare installed vs latest version)
- Existing install preservation (never clobber user config)

### 3.2 Codebase Scanner Subsystem

**Purpose:** Build a comprehensive map of the project.

```
Agent: gtd-codebase-mapper
├── File Discovery      — Walk tree, respect .gitignore
├── Language Detection   — Identify languages per file and overall
├── Framework Detection  — Fingerprint frameworks (React, Express, Django, etc.)
├── Entry Point ID      — Find main/index files, CLI entry points
├── Module Mapping      — Package structure, import graph (top-level)
├── Infra Detection     — Docker, K8s, Terraform, CI/CD files
├── DB Schema Extract   — Migration files, ORM models, SQL schemas
└── Output Generation   — CODEBASE-MAP.md + FILE-INDEX.json
```

**CODEBASE-MAP.md Structure:**
```markdown
# Codebase Map

## Project Identity
- **Name:** my-project
- **Languages:** TypeScript (72%), Python (18%), SQL (10%)
- **Frameworks:** Next.js 14, FastAPI, PostgreSQL
- **Build System:** npm + Docker Compose
- **Runtime:** Node.js 20, Python 3.12

## Architecture Fingerprint
- **Pattern:** Monorepo (frontend + API + workers)
- **API Style:** REST + WebSocket
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** NextAuth.js + JWT
- **Deployment:** Docker → AWS ECS

## Module Map
- `apps/web/` — Next.js frontend (145 files)
- `apps/api/` — FastAPI backend (89 files)
- `packages/shared/` — Shared types and utils (23 files)
- `infra/` — Terraform + Docker (12 files)

## Entry Points
- `apps/web/src/app/layout.tsx` — Frontend entry
- `apps/api/main.py` — API entry
- `docker-compose.yml` — Service orchestration
```

### 3.3 Analysis Engine Subsystem

**Purpose:** Deep code understanding across multiple dimensions.

| Analyzer Agent | Focus Area | Key Outputs |
|---------------|------------|-------------|
| `architecture-analyzer` | Component boundaries, layers, patterns | Architecture pattern classification, component interaction map |
| `api-extractor` | API endpoints, contracts, schemas | Endpoint inventory, request/response schemas, auth requirements |
| `pattern-detector` | Design patterns, code conventions | Pattern catalog, convention rules, anti-pattern flags |
| `data-flow-tracer` | Request lifecycle, event flow, state | Sequence diagrams, data transformation chain, state machine |
| `dependency-analyzer` | External deps, internal module graph | Dependency tree, version matrix, vulnerability surface |
| `security-scanner` | Auth, encryption, input validation | Security surface map, compliance gap analysis |
| `performance-profiler` | Bottlenecks, scaling limits, resource usage | Hotspot map, scaling characteristics, resource budget |

**Analysis Cache Strategy:**
- Each analysis writes to `.planning/analysis/<DIMENSION>.md`
- Cache key: git commit hash + file list hash
- Stale check: `git diff --name-only <cached-commit>..HEAD`
- Incremental: re-analyze only changed files, merge with cached results

### 3.4 Document Writer Subsystem

**Purpose:** Generate professional documents from analysis.

**Writer Agent Architecture:**

```
Writer Agent Input:
┌──────────────────────────────┐
│ 1. Template (structure)      │  ← What sections to produce
│ 2. Analysis artifacts        │  ← What to write about
│ 3. CODEBASE-MAP.md           │  ← Project context
│ 4. config.json               │  ← Formatting preferences
│ 5. Prior documents (if any)  │  ← For cross-references
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Writer Agent Process:        │
│ 1. Load template schema      │
│ 2. Map analysis → sections   │
│ 3. For each section:         │
│    a. Gather relevant data   │
│    b. Read source files      │
│    c. Generate content       │
│    d. Create diagrams        │
│ 4. Assemble full document    │
│ 5. Generate TOC              │
│ 6. Add metadata & version    │
└──────────────────────────────┘
         │
         ▼
Writer Agent Output:
┌──────────────────────────────┐
│ documents/<TYPE>-DRAFT.md    │
└──────────────────────────────┘
```

### 3.5 Verification Subsystem

**Purpose:** Ensure generated documents are accurate.

```
Accuracy Verifier:
├── File Path Verification  — Do referenced files actually exist?
├── Code Reference Check    — Do code snippets match actual source?
├── Config Value Check      — Are stated config values current?
├── API Endpoint Check      — Do documented endpoints exist?
├── Dependency Check        — Are stated dependencies accurate?
├── Diagram Validation      — Do diagrams match actual structure?
└── Staleness Detection     — Flag sections referencing changed code

Completeness Auditor:
├── Template Coverage       — Are all template sections filled?
├── Component Coverage      — Are all major components documented?
├── API Coverage            — Are all endpoints documented?
├── Cross-Reference Check   — Do documents reference each other correctly?
└── Gap Report              — List undocumented areas
```

### 3.6 Incremental Update Subsystem

**Purpose:** Update documents when code changes, without full regeneration.

```
/gtd-update [--since <commit>]
├── Git Diff Analysis       — What files changed?
├── Impact Mapping          — Which documents are affected?
├── Section-Level Targeting — Which specific sections need update?
├── Re-analyze Changed      — Run targeted analysis on changed code
├── Merge Updates           — Patch affected sections into existing docs
├── Re-verify               — Verify only updated sections
└── Version Bump            — Update document version metadata
```

### 3.7 State Management Subsystem

**STATE.md tracks pipeline progress:**

```markdown
# GTD State

## Pipeline
- **Last Scan:** 2026-04-10 @ commit abc1234
- **Last Analysis:** 2026-04-10 @ commit abc1234
- **Active Document:** TDD (drafting)
- **Forward Phase:** Phase 2 (executing)

## Documents
| Document | Status | Version | Last Updated | Commit |
|----------|--------|---------|-------------|--------|
| TDD | draft | 0.1 | 2026-04-10 | abc1234 |
| HLD | pending | - | - | - |
| LLD | pending | - | - | - |

## Forward Pipeline
| Phase | Status | Tasks | Completed | Commit |
|-------|--------|-------|-----------|--------|
| Phase 1 | deployed | 8 | 8 | def5678 |
| Phase 2 | executing | 12 | 5 | - |
| Phase 3 | planned | 15 | 0 | - |

## Analysis Cache
| Dimension | Status | Commit | Stale? |
|-----------|--------|--------|--------|
| Architecture | complete | abc1234 | no |
| API Surface | complete | abc1234 | no |
| Data Flow | pending | - | - |

## Sync Status
| Artifact | Sync State | Last Check | Drift Level |
|----------|------------|------------|-------------|
| API Spec | synced | 2026-04-10 | none |
| Architecture | drifted | 2026-04-10 | minor |
```

### 3.8 Forward Planning Subsystem

**Purpose:** Transform requirements into actionable development plans.

```
/gtd-new-project <idea>
├── Requirements Research   — AI researches domain, tech stack options
│   ├── Domain Researcher   — Understands problem space
│   ├── Tech Researcher     — Evaluates frameworks, libraries
│   └── Feasibility Agent   — Assesses complexity and risks
├── Roadmap Generation      — Break project into phases
│   ├── Phase Decomposition — Logical groupings of functionality
│   ├── Dependency Ordering — Phases ordered by prerequisites
│   └── Milestone Definition — Deliverables per phase
├── Phase Planning          — Detailed task breakdown per phase
│   ├── Task Identification — Specific implementation tasks
│   ├── Wave Assignment     — Group tasks by parallelizability
│   └── Acceptance Criteria — Define "done" for each task
└── Output Generation       — ROADMAP.md + PHASE-*.md artifacts
```

**Key Artifacts:**
- `.planning/forward/ROADMAP.md` — High-level project roadmap
- `.planning/forward/PHASE-<N>.md` — Detailed plan per phase
- `.planning/forward/RESEARCH.md` — Research findings and decisions

### 3.9 Execution Subsystem

**Purpose:** Generate code from plans via executor agents.

```
/gtd-execute-phase <phase-number>
├── Plan Loading            — Read PHASE-<N>.md for task list
├── Wave Orchestration      — Execute tasks in dependency waves
│   ├── Wave 1: Independent tasks (parallel)
│   ├── Wave 2: Tasks depending on Wave 1 (parallel)
│   └── Wave N: Final dependent tasks
├── Executor Agents         — One agent per task
│   ├── Context Loading     — Task spec + relevant existing code
│   ├── Code Generation     — Produce source files
│   ├── Self-Review         — Agent reviews own output
│   └── File Writing        — Write generated code to disk
├── Integration Check       — Verify cross-task compatibility
└── Phase Completion        — Update STATE.md, mark phase done
```

**Wave-Based Parallel Execution:**
```
Wave 1: [Task A] [Task B] [Task C]    ← No dependencies, run in parallel
            │         │
Wave 2:     └─[Task D]┘  [Task E]     ← D depends on A+B; E is independent
                  │           │
Wave 3:           └───[Task F]┘        ← F depends on D+E
```

### 3.10 Deploy & Test Subsystem

**Purpose:** Deploy generated code locally and validate via tests.

```
/gtd-deploy-local
├── Environment Setup       — Install dependencies, configure env
│   ├── Dependency Install  — npm install, pip install, etc.
│   ├── Env Config          — Generate .env from templates
│   └── Database Setup      — Run migrations, seed data
├── Local Deployment        — Start services locally
│   ├── Process Management  — Start/stop/restart services
│   ├── Port Allocation     — Assign and track service ports
│   └── Health Checks       — Verify services are responding
└── Output                  — DEPLOY-STATUS.md with endpoints

/gtd-run-tests
├── Test Discovery          — Find test files and frameworks
├── Test Execution          — Run test suites
│   ├── Unit Tests          — Per-module test execution
│   ├── Integration Tests   — Cross-module test execution
│   └── Smoke Tests         — End-to-end basic verification
├── Result Analysis         — Parse test output
│   ├── Pass/Fail Summary   — Aggregate results
│   ├── Failure Diagnosis   — AI analyzes failures
│   └── Fix Suggestions     — Propose code fixes for failures
└── Output                  — TEST-RESULTS.md
```

### 3.11 Drift Detection Subsystem

**Purpose:** Detect when spec/docs and code diverge.

```
/gtd-check-drift
├── Spec-Code Comparison    — Compare planning artifacts to actual code
│   ├── API Contract Drift  — Spec says X endpoints, code has Y
│   ├── Architecture Drift  — Planned patterns vs actual patterns
│   ├── Schema Drift        — Documented models vs actual models
│   └── Config Drift        — Documented config vs actual config
├── Drift Categorization
│   ├── None                — Spec and code fully agree
│   ├── Minor               — Cosmetic differences, naming changes
│   ├── Moderate            — Functional differences, added features
│   └── Major               — Structural divergence, missing components
├── Drift Report Generation — DRIFT-REPORT.md
│   ├── Per-artifact drift summary
│   ├── Specific discrepancies listed
│   └── Recommended reconciliation strategy
└── State Update            — Mark artifacts as synced/drifted in STATE.md
```

### 3.12 Reconciliation Subsystem

**Purpose:** Bring spec and code back into agreement.

```
/gtd-reconcile [--strategy <strategy>]
├── Strategy Selection
│   ├── spec-wins           — Update code to match spec
│   │   └── Generate code patches to align with spec
│   ├── code-wins           — Update spec/docs to match code
│   │   └── Re-run backward pipeline on drifted areas
│   └── interactive         — Present diffs, user decides per item
│       ├── Show each discrepancy
│       ├── User picks spec-wins or code-wins per item
│       └── Apply mixed resolution
├── Resolution Execution
│   ├── Code Patches        — For spec-wins items
│   ├── Doc Updates         — For code-wins items
│   └── Verification        — Confirm drift resolved
├── Sync Verification       — Re-run drift check to confirm clean
└── State Update            — Mark all artifacts as synced
```

**Reconciliation Strategies:**

| Strategy | Use Case | Behavior |
|----------|----------|----------|
| `spec-wins` | Spec is the source of truth | Executor agents generate code patches to match spec |
| `code-wins` | Code evolved and spec needs catching up | Backward pipeline re-generates docs for drifted areas |
| `interactive` | Mixed situation, user decides | Per-discrepancy choice presented to developer |

---

## 4. User Workflows

### 4.1 First-Time Full Documentation

```
User                          GTD System
  │                              │
  │  npx get-things-done         │
  │────────────────────────────>│  Install framework
  │                              │
  │  /gtd-scan                   │
  │────────────────────────────>│  Map codebase → CODEBASE-MAP.md
  │                              │
  │  /gtd-create-all             │
  │────────────────────────────>│  ┌─ Run all analyzers (parallel)
  │                              │  ├─ Generate TDD (writer + verifier)
  │                              │  ├─ Generate HLD (writer + verifier)
  │  "Here's the TDD draft..."  │  ├─ Generate LLD (writer + verifier)
  │<────────────────────────────│  ├─ ...
  │                              │  │
  │  "Looks good, but add..."   │  │
  │────────────────────────────>│  ├─ Apply feedback
  │                              │  ├─ Finalize documents
  │  "All 7 docs generated."    │  └─ Write to .planning/documents/
  │<────────────────────────────│
  │                              │
```

### 4.2 Single Document Generation

```
User: /gtd-create-tdd --format enterprise

System:
1. Check analysis cache → stale? → re-scan if needed
2. Spawn architecture-analyzer + pattern-detector (parallel)
3. Collect analysis artifacts
4. Spawn tdd-writer with analysis + enterprise template
5. Spawn accuracy-verifier on draft
6. Present to user: "Here's your TDD draft with 2 accuracy notes..."
7. User: "approved" → finalize and write
```

### 4.3 Incremental Update After Code Changes

```
User: /gtd-update --since last-release

System:
1. git diff --name-only v1.2.0..HEAD → 23 files changed
2. Impact analysis: TDD (3 sections), HLD (1 section), API-DOCS (5 endpoints)
3. Re-analyze changed files only
4. Patch affected sections
5. Re-verify patched sections
6. Present: "Updated 3 documents. 9 sections revised."
7. User reviews → approve → version bump
```

### 4.4 CI/CD Automated Documentation

```typescript
// Using GTD SDK in CI pipeline
import { GTD } from 'get-things-done-sdk';

const gtd = new GTD({ projectDir: process.cwd() });

// Check if docs are stale
const status = await gtd.checkStaleness();
if (status.staleDocuments.length > 0) {
  // Auto-update stale documents
  const result = await gtd.updateAll({ since: 'HEAD~1' });
  
  // Commit updated docs
  if (result.updatedDocs.length > 0) {
    await exec('git add .planning/documents/');
    await exec('git commit -m "docs: auto-update technical documentation"');
  }
}
```

### 4.5 Greenfield Forward Engineering

```
User                          GTD System
  │                              │
  │  /gtd-new-project            │
  │  "Build a REST API for       │
  │   task management with       │
  │   auth and team support"     │
  │────────────────────────────>│  ┌─ Spawn research agents (parallel)
  │                              │  │  ├─ Domain researcher
  │                              │  │  ├─ Tech researcher
  │  "Here's the roadmap..."    │  │  └─ Feasibility agent
  │<────────────────────────────│  ├─ Generate ROADMAP.md (3 phases)
  │                              │  └─ Generate PHASE-1.md ... PHASE-3.md
  │  /gtd-execute-phase 1        │
  │────────────────────────────>│  ┌─ Load PHASE-1.md tasks
  │                              │  ├─ Wave 1: [auth module] [db schema]
  │                              │  ├─ Wave 2: [user endpoints] [team model]
  │  "Phase 1 complete.          │  └─ Wave 3: [integration wiring]
  │   8 tasks done."            │
  │<────────────────────────────│
  │                              │
  │  /gtd-deploy-local           │
  │────────────────────────────>│  ┌─ Install dependencies
  │                              │  ├─ Run migrations
  │  "API running on :3000.      │  ├─ Start server
  │   All health checks pass."  │  └─ Health checks → DEPLOY-STATUS.md
  │<────────────────────────────│
  │                              │
  │  /gtd-run-tests              │
  │────────────────────────────>│  ┌─ Discover test files
  │                              │  ├─ Run test suites
  │  "12 passed, 1 failed.      │  ├─ Analyze failures
  │   Fix suggestion: ..."      │  └─ TEST-RESULTS.md
  │<────────────────────────────│
  │                              │
```

### 4.6 Bidirectional: Build + Document Simultaneously

```
User                          GTD System
  │                              │
  │  /gtd-new-project            │
  │  "Build X" --with-docs       │
  │────────────────────────────>│  Generate roadmap + phase plans
  │                              │
  │  /gtd-execute-phase 1        │
  │────────────────────────────>│  ┌─ Forward: Generate code (executor agents)
  │                              │  ├─ Backward: Generate docs (writer agents)
  │  "Phase 1 built + docs      │  │  in parallel with code generation
  │   generated."               │  └─ Verify: Cross-check code ↔ docs
  │<────────────────────────────│
  │                              │
  │  /gtd-execute-phase 2        │
  │────────────────────────────>│  ┌─ Forward: Generate phase 2 code
  │                              │  ├─ Backward: Update docs for new code
  │  "Phase 2 complete.          │  ├─ Sync: Check phase 1 drift
  │   Docs updated. No drift."  │  └─ Report status
  │<────────────────────────────│
  │                              │
```

### 4.7 Sync After Code Changes

```
User                          GTD System
  │                              │
  │  (developer manually edits   │
  │   code outside GTD)          │
  │                              │
  │  /gtd-check-drift            │
  │────────────────────────────>│  ┌─ Compare spec artifacts to code
  │                              │  ├─ Categorize drift per artifact
  │  "Drift detected:            │  └─ Generate DRIFT-REPORT.md
  │   - API: 2 new endpoints    │
  │   - Schema: 1 new field     │
  │   - Architecture: no drift" │
  │<────────────────────────────│
  │                              │
  │  /gtd-reconcile              │
  │  --strategy code-wins        │
  │────────────────────────────>│  ┌─ Re-run backward pipeline on drifted areas
  │                              │  ├─ Update API docs for new endpoints
  │  "Reconciled. All artifacts  │  ├─ Update schema docs for new field
  │   now synced."              │  └─ Re-verify updated sections
  │<────────────────────────────│
  │                              │
```

---

## 5. Data Architecture

### 5.1 Data Flow Diagram

```
┌──────────────┐
│  Source Code  │──── Read ────┐
│  (*.ts, *.py │               │
│   *.go, etc.)│               ▼
└──────────────┘     ┌──────────────────┐
                     │  Codebase Mapper  │
┌──────────────┐     │  (gtd-tools.cjs)  │
│  .gitignore  │────>│                   │
│  config.json │     └────────┬─────────┘
└──────────────┘              │
                              ▼
                     ┌──────────────────┐
                     │  CODEBASE-MAP.md  │
                     │  FILE-INDEX.json  │
                     └────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                  ▼
     ┌──────────┐     ┌──────────┐       ┌──────────┐
     │ Arch     │     │ API      │       │ Data     │
     │ Analyzer │     │ Extractor│       │ Tracer   │
     └────┬─────┘     └────┬─────┘       └────┬─────┘
          │                │                    │
          ▼                ▼                    ▼
     ┌──────────────────────────────────────────────┐
     │           analysis/ directory                 │
     │  ARCHITECTURE-ANALYSIS.md | API-SURFACE.md   │
     │  DATA-FLOW.md | DEPENDENCY-GRAPH.md | ...    │
     └─────────────────────┬────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Writer Agent │◄──── templates/*.md
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  DRAFT.md    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Verifier    │◄──── Source Code (re-read)
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  FINAL.md    │──── documents/*.md
                    └──────────────┘
```

### 5.2 State Machine

```
                         FORWARD PIPELINE STATES
                    ┌─────────┐
                    │  IDLE   │
                    └────┬────┘
                         │ /gtd-new-project
                         ▼
                    ┌────────────┐
                    │ RESEARCHED │ (RESEARCH.md + ROADMAP.md exist)
                    └────┬───────┘
                         │ /gtd-plan-phase
                         ▼
                    ┌──────────┐
                    │ PLANNED  │ (PHASE-<N>.md generated)
                    └────┬─────┘
                         │ /gtd-execute-phase
                         ▼
                    ┌───────────┐
                    │ EXECUTING │ (code generation in progress)
                    └────┬──────┘
                         │ phase complete
                         ▼
                    ┌───────────┐
                    │ DEPLOYED  │ (locally running via /gtd-deploy-local)
                    └────┬──────┘
                         │ /gtd-run-tests
                         ▼
                    ┌───────────┐
                    │ VERIFIED  │ (tests passing)
                    └───────────┘

                         BACKWARD PIPELINE STATES
                    ┌─────────┐
                    │  EMPTY  │ (no .planning/)
                    └────┬────┘
                         │ /gtd-scan
                         ▼
                    ┌─────────┐
                    │ SCANNED │ (CODEBASE-MAP.md exists)
                    └────┬────┘
                         │ /gtd-analyze or /gtd-create-*
                         ▼
                    ┌──────────┐
                    │ ANALYZED │ (analysis/ populated)
                    └────┬─────┘
                         │ /gtd-create-*
                         ▼
                    ┌──────────┐
                    │ DRAFTING │ (draft in progress)
                    └────┬─────┘
                         │ draft complete
                         ▼
                    ┌──────────┐
                    │ REVIEW   │ (awaiting user approval)
                    └────┬─────┘
                         │ user approves
                         ▼
                    ┌───────────┐
                    │ FINALIZED │ (documents/ written)
                    └────┬──────┘
                         │ code changes detected
                         ▼
                    ┌─────────┐
                    │  STALE  │ (needs /gtd-update)
                    └─────────┘

                         SYNC STATES
                    ┌──────────┐
                    │  SYNCED  │ (spec and code agree)
                    └────┬─────┘
                         │ code or spec changes
                         ▼
                    ┌──────────┐
                    │ DRIFTED  │ (discrepancies detected)
                    └────┬─────┘
                         │ /gtd-reconcile
                         ▼
                    ┌──────────┐
                    │  SYNCED  │ (reconciled)
                    └──────────┘
```

### 5.3 Configuration Schema

```json
{
  "version": "2.0.0",
  "project": {
    "name": "my-project",
    "description": "Auto-detected or user-provided"
  },
  "scan": {
    "exclude_patterns": ["node_modules", "dist", ".git", "*.lock"],
    "include_tests": false,
    "max_file_size_kb": 500,
    "max_files": 10000
  },
  "analysis": {
    "dimensions": ["architecture", "api", "data-flow", "dependencies", "security", "performance"],
    "depth": "standard",
    "language_specific": true
  },
  "documents": {
    "format": "enterprise",
    "output_dir": ".planning/documents",
    "diagram_format": "mermaid",
    "include_code_snippets": true,
    "max_snippet_lines": 30
  },
  "workflow": {
    "auto_scan_on_create": true,
    "require_verification": true,
    "require_review": true,
    "parallelization": true
  },
  "forward": {
    "planning_depth": "detailed",
    "research_agents": ["domain", "tech", "feasibility"],
    "execution_parallelization": "wave",
    "max_parallel_executors": 5,
    "deploy_method": "local",
    "deploy_port_range": [3000, 4000],
    "auto_test_after_deploy": true
  },
  "sync": {
    "auto_sync": false,
    "drift_check_frequency": "on-command",
    "default_reconciliation_strategy": "interactive",
    "drift_thresholds": {
      "minor": "cosmetic",
      "moderate": "functional",
      "major": "structural"
    }
  },
  "models": {
    "analyzer": "sonnet",
    "writer": "sonnet",
    "verifier": "haiku",
    "researcher": "opus",
    "executor": "sonnet",
    "drift_detector": "haiku"
  }
}
```

---

## 6. Integration Points

### 6.1 Git Integration

| Operation | Purpose |
|-----------|---------|
| `git log --oneline -20` | Recent commit context for doc generation |
| `git diff --name-only <hash>..HEAD` | Change detection for incremental updates |
| `git blame <file>` | Authorship context for runbooks |
| `git tag --list` | Version history for capacity planning |
| `git remote get-url origin` | Repository metadata |

### 6.2 Package Manager Integration

| System | Detection | Data Extracted |
|--------|-----------|----------------|
| npm/yarn/pnpm | `package.json` | Dependencies, scripts, metadata |
| pip/poetry | `requirements.txt`, `pyproject.toml` | Dependencies, Python version |
| Go modules | `go.mod` | Dependencies, Go version |
| Cargo | `Cargo.toml` | Dependencies, Rust edition |
| Maven/Gradle | `pom.xml`, `build.gradle` | Dependencies, Java version |

### 6.3 Infrastructure Detection

| System | Files Detected | Data Extracted |
|--------|---------------|----------------|
| Docker | `Dockerfile`, `docker-compose.yml` | Services, ports, volumes, networks |
| Kubernetes | `*.yaml` in `k8s/`, `charts/` | Deployments, services, ingress, HPA |
| Terraform | `*.tf` | Resources, providers, outputs |
| GitHub Actions | `.github/workflows/*.yml` | CI/CD pipeline stages |
| AWS CDK | `cdk.json`, `lib/*.ts` | Cloud resources |

---

## 7. Cross-Cutting Concerns

### 7.1 Error Handling

| Error Type | Recovery Strategy |
|------------|-------------------|
| Agent timeout | Retry once with reduced scope, then report partial |
| Analysis failure | Skip dimension, note gap in document |
| Template mismatch | Fall back to generic template |
| Git unavailable | Proceed without versioning, warn user |
| Large codebase OOM | Chunk analysis by module |
| Executor failure | Retry task, if persistent skip and report in phase summary |
| Deploy failure | Report diagnostics, suggest manual fixes |
| Test failure | AI analyzes failure, suggests code fix |
| Drift detection error | Fall back to full re-scan |

### 7.2 Logging and Observability

- Pipeline progress displayed via STATUS.md and terminal UI
- Each agent writes execution metadata to STATE.md
- Error and warning accumulation for post-run report
- Cost tracking (tokens consumed per agent)

### 7.3 Internationalization

- Document output language configurable via `config.json`
- Template schemas support i18n section headers
- Agent response language follows configuration
- Initial support: English, with framework for additional languages

### 7.4 Extensibility

- Custom document types via user-defined templates
- Custom analyzer agents via agent definition files
- Plugin system for organization-specific analysis patterns
- Template format variants (enterprise, startup, compliance, custom)
- Custom executor agent strategies for forward pipeline
- Custom reconciliation strategies for sync pipeline

---

## 8. Deployment Model

### 8.1 Distribution

```
┌───────────────────────┐
│    npm Registry        │
│  get-things-done       │
│  (published package)   │
└──────────┬────────────┘
           │ npx get-things-done@latest
           ▼
┌──────────────────────────────────────────┐
│  User's Machine                          │
│                                          │
│  ~/.claude/get-things-done/  (global)    │
│       OR                                 │
│  ./.claude/get-things-done/  (local)     │
│                                          │
│  No server. No database. No cloud.       │
│  Everything runs locally via AI runtime. │
└──────────────────────────────────────────┘
```

### 8.2 SDK Distribution

```
npm install get-things-done-sdk
```

For CI/CD and programmatic usage.

---

## 9. Key Design Decisions

| # | Decision | Rationale | Alternatives Considered |
|---|----------|-----------|------------------------|
| D-01 | Markdown for all artifacts | Human-readable, git-friendly, renders everywhere | JSON (too verbose), HTML (hard to edit) |
| D-02 | File-based agent communication | No server needed, survives crashes, inspectable | Message queue (overkill), in-memory (lost on crash) |
| D-03 | Analysis cache keyed by git commit | Deterministic staleness detection | Timestamp-based (unreliable), hash-based (expensive) |
| D-04 | Separate analyzer and writer agents | Single-responsibility, parallelizable analysis | Single mega-agent (context rot), two-pass single agent (wasteful) |
| D-05 | Template-driven document generation | Consistent structure, customizable | Free-form generation (inconsistent), rigid schema (inflexible) |
| D-06 | Verification as separate phase | Catches hallucination before user sees it | Inline verification (slows writer), none (accuracy risk) |
| D-07 | Incremental updates via git diff | Efficient for large projects | Full regeneration (expensive), file watcher (complex) |
| D-08 | Multi-runtime installer pattern (from GSD) | Proven approach, wide IDE support | Runtime-specific packages (maintenance burden) |
| D-09 | CJS for CLI tools (from GSD) | Maximum Node.js compatibility | ESM (import issues), TypeScript (needs build) |
| D-10 | `.planning/` as output directory | Clear separation from source code | `docs/` (conflicts), root level (messy) |
| D-11 | Bidirectional pipeline architecture | Supports both greenfield (forward) and brownfield (backward) projects | Forward-only (ignores existing code), backward-only (cannot build new) |
| D-12 | Wave-based parallel execution | Respects task dependencies while maximizing parallelism | Sequential (too slow), fully parallel (dependency violations), DAG scheduler (overkill for phase-scoped work) |
| D-13 | Three reconciliation strategies (spec-wins, code-wins, interactive) | Different situations require different sources of truth | Single strategy (too rigid), auto-resolve (too risky) |
| D-14 | Drift detection as separate subsystem | Decouples change monitoring from resolution; enables check-only workflows | Inline drift checks on every command (too expensive), manual comparison (error-prone) |
| D-15 | Local-first deployment for forward pipeline | Immediate feedback loop, no cloud dependency, works offline | Cloud deploy (slow feedback, requires accounts), container-only (heavy setup) |

---

*End of High-Level Design Document*
