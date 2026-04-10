# Get Things Done (GTD) - Unified Phased Implementation Plan

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft
**Codename:** Bidirectional Engineering Framework

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Implementation Philosophy](#implementation-philosophy)
- [Phase Overview Map](#phase-overview-map)
- [Phase 0: Project Bootstrap and Scaffolding](#phase-0-project-bootstrap-and-scaffolding)
- [Phase 1: Foundation Layer — CLI Tools and State Machine](#phase-1-foundation-layer--cli-tools-and-state-machine)
- [Phase 2: Discovery Engine — Codebase Scanner](#phase-2-discovery-engine--codebase-scanner)
- [Phase 3: Backward — Analysis Engine](#phase-3-backward--analysis-engine)
- [Phase 4: Backward — Document Generation Engine](#phase-4-backward--document-generation-engine)
- [Phase 5: Backward — Verification Engine](#phase-5-backward--verification-engine)
- [Phase 6: Backward — Orchestration and Commands](#phase-6-backward--orchestration-and-commands)
- [Phase 7: Forward — Research and Planning Engine](#phase-7-forward--research-and-planning-engine)
- [Phase 8: Forward — Execution Engine](#phase-8-forward--execution-engine)
- [Phase 9: Forward — Deploy and Test Engine](#phase-9-forward--deploy-and-test-engine)
- [Phase 10: Forward — Orchestration and Commands](#phase-10-forward--orchestration-and-commands)
- [Phase 11: Sync Mode — Drift Detection and Reconciliation](#phase-11-sync-mode--drift-detection-and-reconciliation)
- [Phase 12: Installer and Multi-Runtime Support](#phase-12-installer-and-multi-runtime-support)
- [Phase 13: Incremental Updates and Diff Engine](#phase-13-incremental-updates-and-diff-engine)
- [Phase 14: SDK and CI/CD Integration](#phase-14-sdk-and-cicd-integration)
- [Phase 15: Hardening, Security, and Production Readiness](#phase-15-hardening-security-and-production-readiness)
- [Phase 16: Enterprise Features and Scale](#phase-16-enterprise-features-and-scale)
- [Phase 17: npm Publication and Launch](#phase-17-npm-publication-and-launch)
- [Risk Register](#risk-register)
- [Dependency Matrix](#dependency-matrix)
- [Quality Gates](#quality-gates)
- [Milestone Calendar](#milestone-calendar)

---

## Executive Summary

This plan builds **Get Things Done (GTD)** — the first bidirectional spec-driven agentic framework — in **17 phases across 20-26 weeks**. The plan is structured so that:

1. **The backward pipeline (code → docs) is built first** (Phases 0-6) — this is the most novel part and proves the core infrastructure
2. **The forward pipeline (idea → code → deploy) is built second** (Phases 7-10) — reusing 70% of the foundation from backward
3. **Sync mode is built third** (Phase 11) — it depends on both directions existing
4. **Cross-cutting concerns come last** (Phases 12-17) — installer, SDK, hardening, enterprise, launch

```
BACKWARD FIRST ◄◄◄              FORWARD SECOND ►►►            SYNC THIRD ◄►
Phases 0-6 (~10 weeks)          Phases 7-10 (~6 weeks)         Phase 11 (~2 weeks)
Proves: analysis, templates,    Adds: research, planning,      Adds: drift detection,
writers, verifiers, pipeline    execution, deploy, test         reconciliation, audit

                    CROSS-CUTTING (Phases 12-17, ~6 weeks)
                    Installer, incremental updates, SDK,
                    security, enterprise, npm publish
```

**Key Milestones:**
- **Week 10:** MVP Backward — `/gtd-scan`, `/gtd-create-all` work end-to-end
- **Week 16:** MVP Forward — `/gtd-new-project` through `/gtd-deploy-local` works
- **Week 18:** Sync Mode — `/gtd-drift` and `/gtd-sync` operational
- **Week 22-26:** v1.0.0 on npm — Full bidirectional framework published

---

## Implementation Philosophy

### Why Backward First?

1. **Novel first** — Backward engineering (code → docs) is GTD's unique innovation. Forward exists in GSD/BMAD. Proving backward first validates the hardest part.
2. **Infrastructure reuse** — Building backward first creates: CLI tools, state machine, config, installer framework, codebase scanner, analysis cache, template engine, agent orchestration, verification. Forward reuses all of these.
3. **Testable immediately** — Backward can be tested against ANY existing codebase. Forward requires building test project fixtures from scratch.
4. **Revenue signal** — Even backward-only is a sellable product (compliance documentation). Forward adds value incrementally.

### Build Order Principle

```
Layer 0: Foundation (config, state, CLI tools)     ← Everything depends on this
Layer 1: Codebase Scanner                          ← Both pipelines need this
Layer 2: Backward pipeline (analysis → docs)       ← Novel, proves infrastructure
Layer 3: Forward pipeline (research → code)        ← Reuses Layer 0-1
Layer 4: Sync mode (drift → reconcile)             ← Depends on both Layer 2+3
Layer 5: Distribution (installer, SDK, npm)         ← Wraps everything
```

### Test Fixture Strategy

```
test-fixtures/
├── micro-project/              # 3 files (backward testing)
├── small-project/              # 20 files, Express + Prisma (backward testing)
├── medium-project/             # 150 files, Next.js + FastAPI (both directions)
├── generated-project/          # Created BY the forward pipeline, then tested by backward
└── drift-project/              # Pre-built with intentional spec-code drift (sync testing)
```

---

## Phase Overview Map

```
        FOUNDATION                    BACKWARD PIPELINE
        ──────────                    ─────────────────
Phase 0 ──> Phase 1 ──> Phase 2 ──> Phase 3 ──> Phase 4 ──> Phase 5 ──> Phase 6
Bootstrap   Foundation  Scanner     Analyzers   Writers     Verifiers   Backward
                                                                        Orchestration
                                                                            │
        FORWARD PIPELINE                                                    │
        ────────────────                                                    │
Phase 7 ──> Phase 8 ──> Phase 9 ──> Phase 10 <─────────────────────────────┘
Research    Execution   Deploy &    Forward         (reuses foundation
& Planning              Test        Orchestration    from Phase 0-2)
                                        │
        SYNC + DISTRIBUTION             │
        ───────────────────             │
Phase 11 ──> Phase 12 ──> Phase 13 ──> Phase 14 ──> Phase 15 ──> Phase 16 ──> Phase 17
Sync Mode   Installer    Incremental   SDK/CI      Hardening    Enterprise    npm
(drift)     (npx)        Updates       Integration  Security     Features     Launch
```

---

## Phase 0: Project Bootstrap and Scaffolding

> **Goal:** Create the project skeleton, dev environment, test infrastructure.
> **Duration:** 3-4 days | **Dependencies:** None
> **Deliverable:** Empty but structured project with test runner ready.

### Tasks

#### 0.1 Repository Initialization
```
- [ ] Initialize git repo
- [ ] package.json: name "get-things-done", version "0.0.1"
- [ ] Configure: vitest, eslint, prettier, husky, lint-staged
- [ ] .gitignore: node_modules, dist, coverage, .planning, .env
- [ ] LICENSE (MIT), CONTRIBUTING.md, CHANGELOG.md
```

#### 0.2 Directory Scaffolding
```
get-things-done/
├── bin/install.js                     # npx entry (stub)
├── bin/gtd-tools.cjs                  # CLI tools (stub)
├── lib/                               # Shared modules (stubs)
│   ├── init.cjs, config.cjs, state.cjs
│   ├── analysis.cjs, template.cjs, docs.cjs
│   ├── phase.cjs, roadmap.cjs        # Forward
│   ├── deploy.cjs, test-runner.cjs    # Forward
│   ├── diff-engine.cjs                # Backward incremental
│   ├── drift-engine.cjs               # Sync
│   ├── file-ops.cjs, frontmatter.cjs, security.cjs
│   └── installers/*.cjs               # Per-runtime (9 stubs)
├── agents/
│   ├── forward/                       # 12 agent stubs
│   ├── backward/                      # 18 agent stubs
│   └── sync/                          # 3 agent stubs
├── commands/gtd/
│   ├── forward/, backward/, sync/, utility/
├── workflows/
│   ├── forward/, backward/, sync/
├── references/                        # Shared knowledge (stubs)
├── templates/
│   ├── forward/                       # Plan, phase, project templates
│   └── backward/                      # Document templates (TDD, HLD, etc.)
├── contexts/, hooks/
├── sdk/src/
├── tests/
│   ├── helpers.cjs, fixtures/
├── test-fixtures/
│   ├── micro-project/
│   └── small-project/
└── docs/design/                       # Existing design docs
```

#### 0.3 Test Infrastructure
```
- [ ] vitest.config.ts
- [ ] tests/helpers.cjs (readFixture, createTempDir, mockGit, cleanup)
- [ ] test-fixtures/micro-project/ (3-file Node.js CLI)
- [ ] test-fixtures/small-project/ (20-file Express + Prisma API)
- [ ] First test: tests/scaffold.test.cjs
```

#### 0.4 CI Pipeline
```
- [ ] .github/workflows/test.yml
- [ ] .github/ISSUE_TEMPLATE/ (bug, feature, enhancement)
```

### Exit Criteria
- [ ] `npm test` passes scaffold test
- [ ] Directory tree matches design spec (both forward + backward dirs)
- [ ] Test fixtures are valid projects
- [ ] CI pipeline green

---

## Phase 1: Foundation Layer — CLI Tools and State Machine

> **Goal:** Build the core infrastructure shared by all three modes.
> **Duration:** 5-7 days | **Dependencies:** Phase 0
> **Deliverable:** Working `gtd-tools.cjs` with state, config, init, frontmatter, file-ops.

### Tasks

#### 1.1 Frontmatter Parser (`lib/frontmatter.cjs`)
```
- parseFrontmatter(content) → { frontmatter, body }
- serializeFrontmatter(frontmatter, body) → string
- Tests: 5 test cases (round-trip, edge cases)
```

#### 1.2 File Operations (`lib/file-ops.cjs`)
```
- atomicWrite(path, content)
- ensureDir(path)
- findProjectRoot(startDir)
- fileExists(path), readFileOr(path, default)
- Tests: 5 test cases
```

#### 1.3 Configuration Module (`lib/config.cjs`)
```
UNIFIED CONFIG supporting all three modes:

{
  // Shared
  "project": { "name", "description" },
  "models": { "analyzer", "writer", "verifier", "researcher", "planner", "executor" },
  "workflow": { "parallelization", "require_verification", "require_review" },
  
  // Backward-specific
  "scan": { "exclude_patterns", "include_tests", "max_file_size_kb", "max_files" },
  "analysis": { "dimensions", "depth", "language_specific" },
  "documents": { "format", "output_dir", "diagram_format", "include_code_snippets" },
  
  // Forward-specific
  "planning": { "granularity", "research_agents", "discussion_mode" },
  "execution": { "branching_strategy", "commit_docs", "use_worktrees" },
  "deploy": { "method", "port", "health_check_path", "env_file" },
  "testing": { "framework", "coverage_threshold", "e2e_enabled" },
  
  // Sync-specific
  "sync": { "auto_sync", "drift_check_on_execute", "reconciliation_strategy" }
}

- loadConfig(), get(), set(), initConfig()
- Absent = enabled pattern
- Tests: 8 test cases
```

#### 1.4 Unified State Machine (`lib/state.cjs`)
```
TRACKS BOTH PIPELINES INDEPENDENTLY:

State structure:
{
  mode: "bidirectional",          // forward | backward | bidirectional
  forward: {
    status: "executing",          // empty|researched|planned|executing|deployed|tested|verified
    current_phase: 3,
    current_milestone: "v1.0",
  },
  backward: {
    status: "analyzed",           // empty|scanned|analyzed|drafting|review|finalized
    last_scan_commit: "abc1234",
    documents: { tdd: { status, version, commit }, ... }
  },
  sync: {
    status: "synced",             // synced|drifted|reconciling
    last_drift_check: "2026-04-10T...",
    drift_items: 0
  },
  metrics: { tokens, cost, agents_spawned }
}

- loadState(), updateState(), transition()
- Forward transitions: empty→researched→planned→executing→deployed→tested→verified
- Backward transitions: empty→scanned→analyzed→drafting→review→finalized→stale
- Sync transitions: synced→drifted→reconciling→synced
- Tests: 12 test cases
```

#### 1.5 Command Router (`bin/gtd-tools.cjs`)
```
Commands: init, config-get, config-set, state, version, 
          phase, roadmap, analysis, template, doc, deploy, drift, test
- Tests: 5 test cases
```

#### 1.6 Init Module (`lib/init.cjs`)
```
Context assembly per workflow type:
- Backward workflows: load analysis status, codebase map, document status
- Forward workflows: load roadmap, phase plans, requirements, research
- Sync workflows: load both + drift report
- Git context: commit, branch, changes
- Tests: 6 test cases
```

### Exit Criteria
- [ ] 6 modules implemented, 40+ tests passing
- [ ] `gtd-tools.cjs` handles both forward and backward init contexts
- [ ] State machine enforces valid transitions for all three modes
- [ ] Config supports all three mode sections

---

## Phase 2: Discovery Engine — Codebase Scanner

> **Goal:** Build the codebase mapper. Used by BOTH backward (scan existing code) and forward (brownfield import).
> **Duration:** 5-7 days | **Dependencies:** Phase 1
> **Deliverable:** `gtd-codebase-mapper` agent → CODEBASE-MAP.md

### Tasks

#### 2.1 Framework Signatures (`references/framework-signatures.md`)
```
30+ frameworks across 7 languages with detection indicators
```

#### 2.2 Codebase Mapper Agent (`agents/backward/gtd-codebase-mapper.md`)
```
Full agent definition: file discovery, language detection, framework fingerprinting,
entry point ID, module mapping, infra detection, DB schema extraction
Output: CODEBASE-MAP.md + analysis/FILE-INDEX.json
```

#### 2.3 Analysis Cache (`lib/analysis.cjs`)
```
getAnalysisStatus(), isStale(), getStaleDimensions(), getCodebaseMapStatus()
Git-commit-based cache invalidation
```

### Exit Criteria
- [ ] Scanner produces valid CODEBASE-MAP.md for test fixtures
- [ ] Detects Express, Prisma, Docker in small-project
- [ ] Analysis cache tracks freshness

---

## Phase 3: Backward — Analysis Engine

> **Goal:** Build all analyzer agents for deep code understanding.
> **Duration:** 8-10 days | **Dependencies:** Phase 2
> **Deliverable:** 7 analyzer agents producing analysis/*.md artifacts

### Tasks
```
3.1 gtd-architecture-analyzer    (12h) — patterns, layers, components
3.2 gtd-api-extractor            (10h) — endpoints, schemas, auth
3.3 gtd-pattern-detector          (8h) — design patterns, conventions
3.4 gtd-data-flow-tracer         (10h) — request lifecycle, events
3.5 gtd-dependency-analyzer       (6h) — deps graph, versions
3.6 gtd-security-scanner          (6h) — auth, encryption, validation
3.7 gtd-performance-profiler      (6h) — caching, scaling, bottlenecks
3.8 Analysis references           (4h) — shared knowledge docs
```

### Exit Criteria
- [ ] All 7 analyzers produce valid output for small-project
- [ ] Each analysis file has YAML frontmatter with commit tracking
- [ ] STATE.md shows pipeline_status: analyzed

---

## Phase 4: Backward — Document Generation Engine

> **Goal:** Templates + 7 writer agents + diagram generator.
> **Duration:** 10-14 days | **Dependencies:** Phase 3
> **Deliverable:** All document types can be generated from analysis.

### Tasks
```
4.1  Template engine (lib/template.cjs)       (8h)
4.2  14+ document templates (7 types × 2 formats)  (16h)
4.3  gtd-tdd-writer (CRITICAL FIRST WRITER)   (12h)
4.4  gtd-hld-writer                            (8h)
4.5  gtd-lld-writer                            (8h)
4.6  gtd-capacity-writer                       (6h)
4.7  gtd-sysdesign-writer                      (8h)
4.8  gtd-api-doc-writer                        (6h)
4.9  gtd-runbook-writer                        (6h)
4.10 gtd-diagram-generator                     (6h)
4.11 Document management (lib/docs.cjs)        (6h)
```

### Exit Criteria
- [ ] TDD writer produces accurate end-to-end document
- [ ] At least 5 of 7 writers produce valid output
- [ ] Template engine handles variables, conditionals, includes

---

## Phase 5: Backward — Verification Engine

> **Goal:** Accuracy verifier and completeness auditor.
> **Duration:** 5-7 days | **Dependencies:** Phase 4
> **Deliverable:** Verification catches hallucination before user sees it.

### Tasks
```
5.1 gtd-accuracy-verifier    (14h) — file paths, code snippets, configs, deps
5.2 gtd-completeness-auditor  (8h) — template coverage, component coverage, gaps
5.3 Verification aggregator   (4h) — combined report, scores
5.4 Verification reference     (4h) — patterns, methodology
```

### Exit Criteria
- [ ] Verifier catches planted inaccuracies (>90% detection)
- [ ] Completeness auditor identifies gaps
- [ ] False positive rate <10%

---

## Phase 6: Backward — Orchestration and Commands

> **Goal:** Wire backward pipeline end-to-end with workflows and commands.
> **Duration:** 8-10 days | **Dependencies:** Phases 1-5
> **Milestone:** ★ MVP Backward — can scan any codebase and generate documents

### Tasks
```
6.1  Workflows (7 backward workflows)                    (24h)
     scan-codebase, analyze-codebase, generate-document,
     create-all, verify-document, review-document, help
     
6.2  Commands (15 backward + 5 utility = 20 commands)    (16h)
     /gtd-scan, /gtd-analyze, /gtd-create-tdd, /gtd-create-hld,
     /gtd-create-lld, /gtd-create-capacity, /gtd-create-sysdesign,
     /gtd-create-api-docs, /gtd-create-runbook, /gtd-create-all,
     /gtd-verify-docs, /gtd-review-docs, /gtd-doc-status,
     /gtd-diff, /gtd-update-docs,
     /gtd-help, /gtd-status, /gtd-settings, /gtd-health, /gtd-map-codebase
     
6.3  Context profiles (3: analysis, writing, review)       (4h)
6.4  Claude Code skill registration (SKILL.md per command) (4h)
```

### Proof-of-Life Test (CRITICAL)
```
Against test-fixtures/small-project/:

/gtd-scan          → CODEBASE-MAP.md created ✓
/gtd-create-tdd    → Auto-analyze → TDD draft → Verified → Finalized ✓
/gtd-create-all    → All 7 documents generated ✓
/gtd-status        → Shows all documents, analysis cache ✓
/gtd-help          → Contextual guidance ✓
```

### Exit Criteria
- [ ] Full backward pipeline: scan → analyze → write → verify → finalize
- [ ] All 20 commands functional
- [ ] Human review gate works
- [ ] Status dashboard accurate

---

## Phase 7: Forward — Research and Planning Engine

> **Goal:** Build the forward pipeline's research, requirements, and planning system.
> **Duration:** 8-10 days | **Dependencies:** Phase 1, 2
> **Deliverable:** `/gtd-new-project` and `/gtd-plan-phase` produce plans from ideas.

### Tasks

#### 7.1 Forward Planning Modules
```
lib/phase.cjs      (8h) — Phase directory management, decimal numbering, plan indexing
lib/roadmap.cjs    (6h) — ROADMAP.md parsing, phase extraction, progress tracking

Forward templates:
  templates/forward/project.md
  templates/forward/requirements.md
  templates/forward/roadmap.md
  templates/forward/state.md
  templates/forward/phase-prompt.md
  templates/forward/context.md
  templates/forward/research/SUMMARY.md, STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md
```

#### 7.2 Research Agents
```
agents/forward/gtd-project-researcher.md     (10h)
  - 4 parallel instances (stack, features, architecture, pitfalls)
  - Web search capability for ecosystem research
  - Writes to .planning/research/*.md

agents/forward/gtd-phase-researcher.md       (8h)
  - Phase-specific research before planning
  - Reads CONTEXT.md to focus research on user decisions

agents/forward/gtd-research-synthesizer.md   (6h)
  - Combines 4 researcher outputs into SUMMARY.md
```

#### 7.3 Planning Agents
```
agents/forward/gtd-roadmapper.md             (8h)
  - Create phased roadmap from requirements
  - Granularity: coarse (3-5), standard (5-8), fine (8-12)

agents/forward/gtd-planner.md                (12h)
  - Create detailed execution plans from phase scope
  - Read research, context, requirements
  - Produce wave-decomposed task list

agents/forward/gtd-plan-checker.md           (8h)
  - Verify plan quality before execution
  - Check: requirements coverage, feasibility, task granularity
  - Revision loop (up to 3 iterations)
```

#### 7.4 Forward References
```
references/questioning.md          — Dream extraction philosophy
references/planning-config.md      — Planning configuration
references/gate-prompts.md         — Quality gate definitions
references/agent-contracts.md      — Orchestrator-agent interface
references/context-budget.md       — Context window allocation
```

#### 7.5 Discussion System
```
workflows/forward/discuss-phase.md  (6h)
  - Gray area identification
  - Preference questioning (visual, API, content, org decisions)
  - Output: {phase}-CONTEXT.md
```

### Exit Criteria
- [ ] `/gtd-new-project` produces PROJECT.md, REQUIREMENTS.md, ROADMAP.md
- [ ] Research agents produce valid research artifacts
- [ ] `/gtd-plan-phase 1` produces verified plan
- [ ] Plan checker catches quality issues

---

## Phase 8: Forward — Execution Engine

> **Goal:** Build the code execution pipeline — executor agents that write code from plans.
> **Duration:** 8-10 days | **Dependencies:** Phase 7
> **Deliverable:** `/gtd-execute-phase` generates code and commits it.

### Tasks

#### 8.1 Executor Agent
```
agents/forward/gtd-executor.md              (16h)
  THE CORE FORWARD AGENT — This agent WRITES CODE.

  Process:
  1. Read plan tasks (ordered, with dependencies)
  2. For each task:
     a. Read context (PROJECT.md, REQUIREMENTS.md, phase CONTEXT.md, RESEARCH.md)
     b. Read existing code files referenced in task
     c. Write/edit code to implement task
     d. Run specified verify command (tests, lint, build)
     e. Atomic git commit with descriptive message
     f. Write task completion to SUMMARY.md
  3. Integration checkpoint: verify cross-task coherence
  
  Key capabilities:
  - File creation, editing, deletion
  - Test execution for verification
  - Git commit management
  - Error handling and recovery
```

#### 8.2 Verification Agents
```
agents/forward/gtd-verifier.md              (10h)
  - Post-execution verification
  - Requirements traceability check
  - Cross-phase regression detection
  - Test coverage analysis

agents/forward/gtd-code-reviewer.md         (8h)
  - Code quality review
  - Anti-pattern detection
  - Convention compliance
  - Security review
```

#### 8.3 Wave-Based Execution System
```
Execution orchestration:
  1. Parse plans → identify dependencies
  2. Group into waves (independent plans in parallel)
  3. Per wave: spawn executor agents
     - Claude Code: Task(subagent_type="gtd-executor")
     - Other runtimes: sequential inline execution
  4. Between waves: integration checkpoint
  5. After all waves: verification

lib/execution.cjs                           (8h)
  - Wave decomposition algorithm
  - Dependency analysis
  - Parallel vs sequential dispatch
  - Worktree management (isolation for parallel)
```

#### 8.4 Debug Agent
```
agents/forward/gtd-debugger.md              (6h)
  - Diagnose test failures
  - Trace error source
  - Suggest and apply fixes
  - Verify fix works
```

### Exit Criteria
- [ ] Executor generates working code from a plan
- [ ] Atomic commits per task
- [ ] Wave-based parallel execution works
- [ ] Verifier catches requirements gaps
- [ ] Test-fixtures/small-project can be recreated from plans

---

## Phase 9: Forward — Deploy and Test Engine

> **Goal:** Local deployment and test execution.
> **Duration:** 5-7 days | **Dependencies:** Phase 8
> **Deliverable:** `/gtd-deploy-local` and `/gtd-test-phase` work end-to-end.

### Tasks

#### 9.1 Deploy Module (`lib/deploy.cjs`)
```
Estimated: 10h

Deployment method detection:
  - Docker Compose → docker-compose up -d
  - Dockerfile only → docker build + docker run
  - package.json with "start" → npm start
  - Python with main.py → python main.py (or uvicorn)
  - Go with main.go → go run .
  - Rust with Cargo.toml → cargo run
  - Custom command from config

Build detection:
  - "build" in package.json scripts → npm run build
  - Dockerfile → docker build
  - Makefile → make build

Health check:
  - Poll configured endpoint (default: localhost:3000/health)
  - Configurable timeout (default: 30s)
  - Configurable interval (default: 2s)

Port management:
  - Detect port from config files (.env, docker-compose, etc.)
  - Check port availability before deploy
  - Kill process on cleanup
```

#### 9.2 Deployer Agent
```
agents/forward/gtd-deployer.md              (8h)
  - Detect deployment method
  - Build project
  - Start services
  - Health check
  - Report deployment status
  - Output: DEPLOY-REPORT.md
```

#### 9.3 Test Runner Module (`lib/test-runner.cjs`)
```
Estimated: 8h

Test framework detection:
  - Jest/Vitest → npm test
  - pytest → pytest
  - Go test → go test ./...
  - Cargo test → cargo test
  - Custom from config

Test execution:
  - Unit tests → run by default
  - Integration tests → run with --integration flag
  - E2E tests → run with --e2e flag
  - Coverage collection

Output: TEST-REPORT.md
  - Pass/fail counts
  - Coverage percentage
  - Failed test mapping to plan tasks
```

#### 9.4 Test Runner Agent
```
agents/forward/gtd-test-runner.md           (6h)
  - Discover test suites
  - Run targeted tests
  - Parse results
  - Map failures to implementation tasks
  - Suggest fixes for failures
```

### Exit Criteria
- [ ] Deploy detects Docker, npm start, python correctly
- [ ] Health check polling works
- [ ] Test runner discovers and executes tests
- [ ] Deploy + test produces accurate reports

---

## Phase 10: Forward — Orchestration and Commands

> **Goal:** Wire forward pipeline end-to-end.
> **Duration:** 8-10 days | **Dependencies:** Phases 7-9
> **Milestone:** ★ MVP Forward — complete forward pipeline works

### Tasks

#### 10.1 Forward Workflows
```
workflows/forward/new-project.md         (8h) — Dream extraction → Research → Requirements → Roadmap
workflows/forward/discuss-phase.md       (4h) — Gray area identification → Preferences
workflows/forward/plan-phase.md          (6h) — Research → Plan → Check → Revise
workflows/forward/execute-phase.md       (6h) — Wave discovery → Parallel execution → Checkpoint
workflows/forward/verify-work.md         (4h) — Verification → Requirements trace
workflows/forward/deploy-local.md        (4h) — Build → Deploy → Health check
workflows/forward/test-phase.md          (3h) — Discover → Run → Report
workflows/forward/ship.md               (3h) — PR creation
workflows/forward/next.md               (4h) — Auto-advance to next step
workflows/forward/autonomous.md          (4h) — Run phases N through M unattended
```

#### 10.2 Forward Commands (18 commands)
```
/gtd-new-project, /gtd-discuss-phase, /gtd-plan-phase,
/gtd-execute-phase, /gtd-verify-work, /gtd-deploy-local,
/gtd-test-phase, /gtd-ship, /gtd-new-milestone, /gtd-complete-milestone,
/gtd-next, /gtd-autonomous, /gtd-quick, /gtd-debug,
/gtd-code-review, /gtd-add-phase, /gtd-progress, /gtd-fast
```

#### 10.3 Forward Context Profiles
```
contexts/research.md   — What to load for researcher agents
contexts/planning.md   — What to load for planner agents
contexts/execution.md  — What to load for executor agents
contexts/deploy.md     — What to load for deployer agents
```

### Proof-of-Life Test (CRITICAL)
```
FULL FORWARD END-TO-END:

/gtd-new-project "Build a simple REST API for managing todos"
  → PROJECT.md, REQUIREMENTS.md, ROADMAP.md created ✓

/gtd-plan-phase 1
  → Research + Plan + Check → Plans created ✓

/gtd-execute-phase 1
  → Code generated, committed ✓

/gtd-deploy-local
  → API running on localhost:3000 ✓

/gtd-test-phase 1
  → Tests pass ✓

/gtd-verify-work 1
  → Requirements met ✓

Then BACKWARD on the generated code:
/gtd-create-tdd
  → Technical Design Document generated from the code GTD just wrote ✓
  → THIS PROVES BIDIRECTIONAL WORKS
```

### Exit Criteria
- [ ] Full forward pipeline: idea → spec → plan → code → deploy → test → verify
- [ ] All 18 forward commands functional
- [ ] Forward-then-backward test passes (code written, then documented)

---

## Phase 11: Sync Mode — Drift Detection and Reconciliation

> **Goal:** Build the bidirectional sync engine.
> **Duration:** 5-7 days | **Dependencies:** Phases 6, 10
> **Milestone:** ★ Sync Mode — GTD's killer differentiator
> **Deliverable:** `/gtd-drift`, `/gtd-reconcile`, `/gtd-sync`, `/gtd-audit`

### Tasks

#### 11.1 Drift Engine (`lib/drift-engine.cjs`)
```
Estimated: 12h

Drift detection algorithm:
1. Parse REQUIREMENTS.md → list of requirements with IDs
2. Parse ROADMAP.md → list of planned features per phase
3. Run lightweight code analysis (reuse backward analyzers)
4. Compare:
   - For each requirement: does code implement it? How?
   - For each code component: is it in the spec? Which requirement?
   - For each doc claim: does it match current code?

Drift categories:
  ADDITION:   Code has feature/endpoint not in spec
  REMOVAL:    Spec mentions feature not in code
  MUTATION:   Both exist but behavior/structure differs
  STRUCTURAL: Architecture changed (new service, removed layer, etc.)

Output: DRIFT-REPORT.md
  - Summary: X additions, Y removals, Z mutations, W structural
  - Per-item: spec reference, code location, drift description, severity
```

#### 11.2 Drift Detector Agent
```
agents/sync/gtd-drift-detector.md          (10h)
  - Read REQUIREMENTS.md, ROADMAP.md, phase plans
  - Read current code analysis (reuse backward analysis cache)
  - Compare spec intent vs code reality
  - Categorize each drift item
  - Severity scoring (critical, major, minor, cosmetic)
  - Output: DRIFT-REPORT.md
```

#### 11.3 Reconciliation Planner Agent
```
agents/sync/gtd-reconciliation-planner.md  (8h)

Strategies:
  spec-wins:  Generate tasks to update code to match spec
  code-wins:  Generate spec updates to match code (most common)
  interactive: Present each drift item, user chooses direction

Process:
1. Read DRIFT-REPORT.md
2. For each drift item:
   a. Determine recommended direction
   b. Generate specific update action
   c. Estimate effort
3. Output: RECONCILIATION-PLAN.md
```

#### 11.4 Alignment Auditor Agent
```
agents/sync/gtd-alignment-auditor.md       (8h)
  - Full coverage matrix: requirement → implementation → test → documentation
  - Gap analysis: undocumented code, unimplemented specs, untested features
  - Compliance scoring per dimension
  - Output: AUDIT-REPORT.md with coverage matrix
```

#### 11.5 Sync Workflows and Commands
```
workflows/sync/detect-drift.md        (4h)
workflows/sync/reconcile.md           (4h)
workflows/sync/sync.md                (4h)
workflows/sync/audit.md               (4h)

commands/gtd/sync/:
  drift.md, reconcile.md, sync.md, audit.md
```

### Proof-of-Life Test
```
Against test-fixtures/drift-project/ (pre-built with intentional drift):

/gtd-drift
  → "Found 5 drift items: 2 additions, 1 removal, 2 mutations" ✓

/gtd-reconcile --strategy code-wins
  → Plan to update REQUIREMENTS.md and 3 document sections ✓

/gtd-sync --auto
  → Specs and docs updated to match code ✓

/gtd-audit
  → Coverage matrix: 94% requirements implemented, 87% documented ✓
```

### Exit Criteria
- [ ] Drift detection identifies planted drift items (>90% detection)
- [ ] Reconciliation produces actionable plans
- [ ] Auto-sync updates specs/docs correctly
- [ ] Audit produces meaningful coverage matrix
- [ ] All 4 sync commands functional

---

## Phase 12: Installer and Multi-Runtime Support

> **Goal:** `npx get-things-done@latest` installs for any runtime.
> **Duration:** 5-7 days | **Dependencies:** Phases 6, 10

### Tasks
```
12.1 Installer core (bin/install.js)        (12h)
12.2 9 runtime adapters                      (16h)
     Claude Code, OpenCode, Gemini, Codex, Copilot,
     Cursor, Windsurf, Augment, Cline
12.3 Installer tests                         (8h)
```

### Exit Criteria
- [ ] `npx get-things-done@latest` works for all runtimes
- [ ] Re-install preserves user config
- [ ] Post-install health check passes

---

## Phase 13: Incremental Updates and Diff Engine

> **Goal:** Efficient incremental document updates and change detection.
> **Duration:** 5-7 days | **Dependencies:** Phase 6

### Tasks
```
13.1 Diff engine (lib/diff-engine.cjs)      (10h)
13.2 Section patcher                         (8h)
13.3 Incremental update workflow             (6h)
13.4 /gtd-update-docs, /gtd-diff commands    (4h)
```

### Exit Criteria
- [ ] Only stale sections regenerated
- [ ] Section patching preserves non-affected content
- [ ] Version history maintained

---

## Phase 14: SDK and CI/CD Integration

> **Goal:** TypeScript SDK for programmatic and headless usage.
> **Duration:** 5-7 days | **Dependencies:** Phases 6, 10, 13

### Tasks
```
14.1 SDK core (GDD class → renamed GTD class)  (12h)
     Full public API: scan, analyze, generate, execute, deploy, drift, sync
14.2 SDK types                                   (4h)
14.3 CI/CD templates (GitHub Actions, GitLab)   (4h)
14.4 SDK tests                                   (8h)
```

### Exit Criteria
- [ ] SDK installs and all public methods work
- [ ] CI/CD pipeline templates functional
- [ ] Headless full lifecycle: forward + backward + sync

---

## Phase 15: Hardening, Security, and Production Readiness

> **Goal:** Production-grade reliability and security.
> **Duration:** 5-7 days | **Dependencies:** Phases 6-14

### Tasks
```
15.1 Secret scanner (lib/security.cjs)      (6h)
15.2 Prompt sanitizer                        (4h)
15.3 Error recovery (pipeline resume)        (8h)
15.4 Runtime hooks (4 hooks)                 (6h)
15.5 Comprehensive error codes (GTD-E001-E020) (4h)
```

### Exit Criteria
- [ ] Secret scanner catches planted secrets
- [ ] Pipeline resumes after interruption
- [ ] All error codes produce actionable messages

---

## Phase 16: Enterprise Features and Scale

> **Goal:** Large codebase support, compliance, custom templates.
> **Duration:** 5-7 days | **Dependencies:** Phase 15

### Tasks
```
16.1 Scale-adaptive intelligence             (8h)
16.2 Domain-decomposed analysis             (6h)
16.3 Custom document types                   (4h)
16.4 Compliance template packs (SOC2, ISO)  (6h)
16.5 Multi-language deep analysis           (8h)
```

### Exit Criteria
- [ ] 500+ file project analyzed successfully
- [ ] Compliance format produces audit-ready docs

---

## Phase 17: npm Publication and Launch

> **Goal:** Publish to npm, documentation, community setup.
> **Duration:** 3-5 days | **Dependencies:** Phases 12, 15, 16
> **Milestone:** ★ v1.0.0 on npm

### Tasks
```
17.1 npm package (package.json, .npmignore, publish)  (4h)
17.2 README.md (install → first use in 5 minutes)     (6h)
17.3 USER-GUIDE.md (detailed reference)                (8h)
17.4 ARCHITECTURE.md, AGENTS.md, COMMANDS.md           (6h)
17.5 Example projects (3 with generated docs)          (6h)
17.6 Community setup (Discord, Issues, Contributing)   (3h)
```

### Exit Criteria
- [ ] `npx get-things-done@latest` works globally
- [ ] All 42 commands documented
- [ ] 3 example projects with forward + backward output
- [ ] CI publishes on tagged release

---

## Risk Register

| # | Risk | Prob | Impact | Mitigation |
|---|------|------|--------|------------|
| R1 | LLM hallucination in generated code (forward) | High | Critical | Plan-checker + verifier + test execution gates |
| R2 | LLM hallucination in generated docs (backward) | High | High | Accuracy verifier cross-references all claims |
| R3 | Large codebase exceeds context window | Medium | High | Scale-adaptive chunking, progressive loading |
| R4 | Multi-runtime compatibility breaks | Medium | Medium | Single runtime first, then expand |
| R5 | Forward-generated code doesn't deploy | Medium | High | Deploy agent with health checks, auto-debug |
| R6 | Drift detection false positives | Medium | Medium | Configurable sensitivity, human review gate |
| R7 | Sync mode creates conflicts | Medium | High | Three-way merge strategy, user approval gate |
| R8 | npm package too large | Low | Low | .npmignore, exclude test fixtures |
| R9 | Secrets leak into docs or commits | Medium | Critical | Secret scanner pre-finalization |
| R10 | Cost overrun for enterprise usage | Medium | Medium | Budget guards, Haiku for verification, caching |
| R11 | Scope creep from bidirectional complexity | High | High | Backward first, forward second, sync third |
| R12 | Agent prompt quality regression | Medium | High | Test fixtures with known-good baselines |

---

## Dependency Matrix

```
Phase  │ Depends On       │ Blocks            │ Duration
───────┼──────────────────┼───────────────────┼─────────
P0     │ -                │ P1                │ 3-4d
P1     │ P0               │ P2, P7, P13, P14  │ 5-7d
P2     │ P1               │ P3, P7            │ 5-7d
P3     │ P2               │ P4                │ 8-10d
P4     │ P3               │ P5                │ 10-14d
P5     │ P4               │ P6                │ 5-7d
P6     │ P1-P5            │ P10, P11, P13     │ 8-10d  ★ MVP Backward
P7     │ P1, P2           │ P8                │ 8-10d
P8     │ P7               │ P9                │ 8-10d
P9     │ P8               │ P10               │ 5-7d
P10    │ P7-P9            │ P11               │ 8-10d  ★ MVP Forward
P11    │ P6, P10          │ P15               │ 5-7d   ★ Sync Mode
P12    │ P6, P10          │ P17               │ 5-7d
P13    │ P1, P6           │ P14               │ 5-7d
P14    │ P6, P10, P13     │ P17               │ 5-7d
P15    │ P6-P14           │ P16               │ 5-7d
P16    │ P15              │ P17               │ 5-7d
P17    │ P12, P15, P16    │ -                 │ 3-5d   ★ Launch

Critical Path: P0→P1→P2→P3→P4→P5→P6→P10→P11→P15→P17
Parallel Track A (backward): P0→P1→P2→P3→P4→P5→P6
Parallel Track B (forward):  P0→P1→P2→(start P7 when P2 done)→P8→P9→P10
```

---

## Quality Gates

| Gate | Criteria |
|------|----------|
| **Code Quality** | ESLint zero warnings, Prettier formatted |
| **Test Coverage** | >80% branch coverage per module |
| **Integration Test** | Proof-of-Life against test fixtures |
| **Backward Regression** | All prior backward tests still pass |
| **Forward Regression** | All prior forward tests still pass |
| **Bidirectional Test** | Forward→backward (code then document) works |
| **State Consistency** | STATE.md accurate after every operation |
| **Manual E2E** | At least one run on a real (non-fixture) project |

---

## Milestone Calendar

```
TRACK A: BACKWARD PIPELINE
Week 1-2:   Phase 0 (Bootstrap) + Phase 1 (Foundation)
Week 3-4:   Phase 2 (Scanner) + Phase 3 (Analyzers begin)
Week 5-6:   Phase 3 (complete) + Phase 4 (Writers begin)
Week 7-8:   Phase 4 (complete) + Phase 5 (Verification)
Week 9-10:  Phase 6 (Backward Orchestration)
            ★ MILESTONE: MVP Backward — /gtd-scan + /gtd-create-all works

TRACK B: FORWARD PIPELINE (starts Week 5, after Phase 2)
Week 5-6:   Phase 7 (Research & Planning) begins
Week 7-8:   Phase 7 (complete) + Phase 8 (Execution begins)
Week 9-10:  Phase 8 (complete) + Phase 9 (Deploy & Test)
Week 11-12: Phase 9 (complete) + Phase 10 (Forward Orchestration)
            ★ MILESTONE: MVP Forward — full ideation-to-deploy pipeline

TRACK C: SYNC + DISTRIBUTION
Week 13-14: Phase 11 (Sync Mode) + Phase 12 (Installer)
            ★ MILESTONE: Sync Mode — bidirectional drift detection
Week 15-16: Phase 13 (Incremental) + Phase 14 (SDK)
Week 17-18: Phase 15 (Hardening) + Phase 16 (Enterprise)
Week 19-20: Phase 17 (Launch prep + npm publish)
            ★ MILESTONE: v1.0.0 published on npm

Post-Launch: Community feedback, additional runtimes, template marketplace
```

```
PARALLELIZATION STRATEGY:

Weeks 1-4:   [===== Track A only (foundation) =====]
Weeks 5-10:  [===== Track A (backward) =====][===== Track B (forward, starts Week 5) =====]
Weeks 11-14: [===== Track C (sync + installer) =====]
Weeks 15-20: [===== Track C (SDK, hardening, enterprise, launch) =====]

With 2 developers:
  Dev 1: Track A (Phases 0-6), then Track C (Phases 11, 13, 15)
  Dev 2: Track B (Phases 7-10, starting week 5), then Track C (Phases 12, 14, 16, 17)
```

---

## Appendix: Total Deliverables Summary

| Category | Count |
|----------|-------|
| Agents | 33 (12 forward + 18 backward + 3 sync) |
| Commands | 42 (18 forward + 15 backward + 4 sync + 5 utility) |
| Workflows | ~25 (10 forward + 8 backward + 4 sync + 3 utility) |
| Lib Modules | ~18 shared infrastructure modules |
| Templates | 20+ (14 backward document templates + 6+ forward plan templates) |
| References | 15+ shared knowledge documents |
| Tests | 200+ test cases |
| Installer Adapters | 9 runtime-specific installers |
| npm Packages | 2 (get-things-done + get-things-done-sdk) |
| **Total Files** | **~250+** |

---

*End of Unified Phased Implementation Plan*
