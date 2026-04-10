# Get Things Done (GTD) - Technical Design Document

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft
**Authors:** Architecture Team

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Problem Statement](#2-problem-statement)
- [3. Goals and Non-Goals](#3-goals-and-non-goals)
- [4. System Overview](#4-system-overview)
- [5. Architecture Philosophy](#5-architecture-philosophy)
- [6. Core Architecture](#6-core-architecture)
- [7. Agent Model](#7-agent-model)
- [8. Document Generation Pipeline](#8-document-generation-pipeline)
- [9. CLI and Command System](#9-cli-and-command-system)
- [10. Runtime Abstraction Layer](#10-runtime-abstraction-layer)
- [11. File System Layout](#11-file-system-layout)
- [12. Technology Stack](#12-technology-stack)
- [13. Security Considerations](#13-security-considerations)
- [14. Testing Strategy](#14-testing-strategy)
- [15. Appendix: Comparison with GSD and BMAD](#15-appendix-comparison-with-gsd-and-bmad)

---

## 1. Executive Summary

**Get Things Done (GTD)** is a spec-driven agentic framework that operates **bidirectionally** — bridging the gap between specifications and code in both directions. Unlike BMAD and GSD which only go from *specifications to code*, and unlike the original GDD which only went from *code to specifications*, GTD does both and keeps them in sync.

GTD is a **meta-prompting, context-engineering, and multi-agent orchestration system** that can:
- **Forward:** Take an idea and drive it through specs, planning, code generation, deployment, and testing
- **Backward:** Read any existing codebase and produce comprehensive technical documentation — including Technical Design Documents, High-Level Designs, Low-Level Designs, Capacity Plans, System Design documents, API documentation, and more
- **Sync:** Detect drift between code and documentation, reconcile differences, and update both sides

**The Bidirectional Paradigm:**

```
GSD / BMAD:  Idea --> Spec --> Plan --> Code --> Verify                    (forward only)
Old GDD:     Code --> Analyze --> Understand --> Document --> Verify       (backward only)
GTD:         Forward:  Idea --> Spec --> Plan --> Code --> Deploy --> Test --> Verify
             Backward: Code --> Scan --> Analyze --> Draft --> Verify --> Finalize
             Sync:     Detect Drift --> Reconcile --> Update Both Sides
```

---

## 2. Problem Statement

### The Documentation Gap

Modern software teams face a persistent documentation crisis:

1. **Greenfield projects** using AI-assisted development (via BMAD/GSD) produce code rapidly but the initial specs drift from the actual implementation
2. **Brownfield projects** with years of evolution have outdated or nonexistent technical documentation
3. **Acquired codebases** arrive with no documentation, making onboarding and audit impossible
4. **Compliance requirements** (SOC2, ISO 27001, HIPAA) demand current architectural documentation
5. **AI context rot** — LLMs generating code progressively lose understanding of what was built, making the final codebase a black box even to the tools that created it

### The Forward Engineering Gap

Existing forward-engineering frameworks (GSD, BMAD) stop at code generation and do not provide:

6. **Local deploy and test** — no integrated pipeline to deploy and verify locally
7. **Spec-code drift detection** — no mechanism to detect when code diverges from its original spec
8. **Bidirectional reconciliation** — no way to update specs when code changes, or update code when specs change

### Why Existing Tools Fail

| Approach | Problem |
|----------|---------|
| JSDoc / Docstrings | Documents functions, not systems |
| Auto-generated API docs | No architectural understanding |
| Manual documentation | Immediately stale, enormous effort |
| Code-to-diagram tools | Structural only, no "why" or "how" |
| LLM chat about code | No persistence, no structure, context rot |

GTD solves this by treating **both forward engineering and documentation generation as multi-agent pipelines** with the same rigor that GSD applies to code generation, while adding drift detection and bidirectional sync.

---

## 3. Goals and Non-Goals

### Goals

| ID | Goal |
|----|------|
| G-01 | Install via `npx get-things-done@latest` into any codebase |
| G-02 | Read and deeply analyze any codebase regardless of language or framework |
| G-03 | Generate structured, professional-grade technical documents |
| G-04 | Support multiple document types: TDD, HLD, LLD, Capacity Plan, System Design, API Docs, Runbooks |
| G-05 | Multi-runtime support: Claude Code, Gemini CLI, OpenCode, Copilot, Cursor, Windsurf, Augment, Cline |
| G-06 | Incremental re-generation — update documents when code changes, don't regenerate from scratch |
| G-07 | Human-in-the-loop review and approval gates before document finalization |
| G-08 | Configurable document templates supporting enterprise, startup, and compliance formats |
| G-09 | SDK for headless/CI document generation |
| G-10 | Forward engineering from idea to deployed code — full pipeline from requirements through planning, execution, and deployment |
| G-11 | Local deploy and test — integrated pipeline to deploy artifacts locally and run verification tests |
| G-12 | Bidirectional spec-code sync and drift detection — detect when code and documentation diverge, reconcile differences, and update both sides |

### Non-Goals

| ID | Non-Goal |
|----|----------|
| NG-01 | Replacing inline code comments or docstrings |
| NG-02 | Project management or sprint ceremonies |
| NG-03 | Real-time documentation sync (we produce snapshots, not live mirrors) |

---

## 4. System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                          USER                                │
│              /gtd-command [args]                              │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                   COMMAND LAYER                               │
│    commands/gtd/*.md — Prompt-based command entry points      │
│    (Claude Code skills / Codex skills / IDE slash commands)   │
│    Forward: /gtd-new-project, /gtd-plan-phase, /gtd-execute  │
│    Backward: /gtd-scan, /gtd-analyze, /gtd-create-*          │
│    Sync: /gtd-drift, /gtd-reconcile, /gtd-sync               │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                  WORKFLOW LAYER                               │
│    get-things-done/workflows/*.md                            │
│    Thin orchestrators: load context -> spawn agents ->       │
│    collect results -> manage state -> route next step        │
└───────┬────────────────┬──────────────────┬──────────────────┘
        │                │                  │
┌───────▼───────┐ ┌──────▼──────┐ ┌────────▼────────┐
│   FORWARD     │ │  BACKWARD   │ │   SYNC          │
│   AGENTS      │ │  AGENTS     │ │   AGENTS        │
│ (researcher,  │ │ (analyzer,  │ │ (drift-detector,│
│  planner,     │ │  writer,    │ │  reconciler,    │
│  executor,    │ │  reviewer)  │ │  auditor)       │
│  deployer)    │ │ (fresh ctx) │ │ (fresh ctx)     │
│ (fresh ctx)   │ │             │ │                 │
└───────┬───────┘ └──────┬──────┘ └────────┬────────┘
        │                │                  │
┌───────▼────────────────▼──────────────────▼──────────────────┐
│                  CLI TOOLS LAYER (shared)                     │
│    get-things-done/bin/gtd-tools.cjs                         │
│    (State, config, analysis cache, templates, doc management)│
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                  FILE SYSTEM                                  │
│  .planning/                                                  │
│    Forward: REQUIREMENTS.md | ROADMAP.md | phases/           │
│    Backward: CODEBASE-MAP.md | analysis/ | documents/        │
│    Sync: DRIFT-REPORT.md                                     │
│    Shared: STATE.md | config.json | templates/               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Architecture Philosophy

### 5.1 Fresh Context Per Agent (From GSD)

Every agent spawned by an orchestrator gets a **clean context window**. This prevents context rot — the quality degradation that happens when an LLM fills its window with accumulated conversation. Each analyzer, writer, or reviewer agent starts fresh with only the context it needs.

### 5.2 Thin Orchestrators (From GSD)

Workflow files never do heavy lifting. They:
- Load context via `gtd-tools.cjs init <workflow>`
- Spawn specialized agents with focused prompts
- Collect results and route to the next step
- Update state between steps

### 5.3 Bidirectional Pipeline (GTD Innovation)

GTD operates in three modes:

**Forward Pipeline:** `Idea -> Spec -> Research -> Plan -> Execute -> Deploy -> Test -> Verify`
**Backward Pipeline:** `Code -> Map -> Analyze -> Draft -> Review -> Finalize`
**Sync Pipeline:** `Detect Drift -> Reconcile -> Update Both Sides`

All three pipelines share the same CLI tools layer, state management, and installer.

```
FORWARD PIPELINE
Phase 1: RESEARCH           Phase 2: PLANNING          Phase 3: EXECUTION
┌──────────────┐           ┌──────────────┐           ┌──────────────┐
│ Project      │           │ Roadmapper   │           │ Executor     │
│ Researcher   │─────────> │              │─────────> │              │
│              │           │ Planner      │           │ Code         │
│ Phase        │           │              │           │ Reviewer     │
│ Researcher   │           │ Plan Checker │           │              │
│              │           │              │           │ Deployer     │
│ Research     │           │              │           │              │
│ Synthesizer  │           │              │           │ Test Runner  │
└──────────────┘           └──────────────┘           └──────────────┘
                                                             │
Phase 4: VERIFICATION                                        │
┌──────────────┐                                             │
│ Verifier     │<────────────────────────────────────────────┘
│              │
│ Debugger     │
└──────────────┘

BACKWARD PIPELINE
Phase 1: DISCOVERY         Phase 2: ANALYSIS          Phase 3: GENERATION
┌──────────────┐          ┌──────────────┐           ┌──────────────┐
│ Codebase     │          │ Architecture │           │ Document     │
│ Mapper       │────────> │ Analyzer     │─────────> │ Writers      │
│              │          │              │           │              │
│ Dependency   │          │ Pattern      │           │ Template     │
│ Scanner      │          │ Detector     │           │ Engine       │
│              │          │              │           │              │
│ API Surface  │          │ Data Flow    │           │ Diagram      │
│ Extractor    │          │ Tracer       │           │ Generator    │
└──────────────┘          └──────────────┘           └──────────────┘
                                                            │
Phase 4: VERIFICATION     Phase 5: FINALIZATION             │
┌──────────────┐          ┌──────────────┐                  │
│ Accuracy     │          │ Format &     │<─────────────────┘
│ Verifier     │<────────>│ Publish      │
│              │          │              │
│ Completeness │          │ Version      │
│ Auditor      │          │ Control      │
└──────────────┘          └──────────────┘

SYNC PIPELINE
┌──────────────┐          ┌──────────────┐           ┌──────────────┐
│ Drift        │          │ Reconciliation│          │ Alignment    │
│ Detector     │────────> │ Planner       │────────> │ Auditor      │
└──────────────┘          └──────────────┘           └──────────────┘
```

### 5.4 Scale-Adaptive Intelligence (From BMAD)

GTD adapts document depth based on project complexity:
- **Micro** (< 5 files): Single combined document
- **Small** (5-50 files): Standard 5-document set
- **Medium** (50-500 files): Full document suite with cross-references
- **Large** (500+ files): Domain-decomposed documents with index
- **Enterprise** (monorepo/microservices): Service-level documents with integration maps

### 5.5 File-Based State (From GSD)

All state lives in `.planning/` as human-readable Markdown and JSON:
- Survives context resets and session boundaries
- Inspectable by both humans and agents
- Git-committable for team visibility
- Incrementally updatable

---

## 6. Core Architecture

### 6.1 Component Hierarchy

```
get-things-done/
├── bin/
│   └── gtd-tools.cjs           # CLI tools layer (state, config, analysis)
├── agents/                      # Agent definitions (YAML frontmatter + prompt)
│   ├── forward/                 # Forward pipeline agents
│   │   ├── gtd-project-researcher.md
│   │   ├── gtd-phase-researcher.md
│   │   ├── gtd-research-synthesizer.md
│   │   ├── gtd-roadmapper.md
│   │   ├── gtd-planner.md
│   │   ├── gtd-plan-checker.md
│   │   ├── gtd-executor.md
│   │   ├── gtd-verifier.md
│   │   ├── gtd-deployer.md
│   │   ├── gtd-test-runner.md
│   │   ├── gtd-debugger.md
│   │   └── gtd-code-reviewer.md
│   ├── backward/                # Backward pipeline agents
│   │   ├── gtd-codebase-mapper.md
│   │   ├── gtd-architecture-analyzer.md
│   │   ├── gtd-api-extractor.md
│   │   ├── gtd-pattern-detector.md
│   │   ├── gtd-data-flow-tracer.md
│   │   ├── gtd-dependency-analyzer.md
│   │   ├── gtd-security-scanner.md
│   │   ├── gtd-performance-profiler.md
│   │   ├── gtd-tdd-writer.md
│   │   ├── gtd-hld-writer.md
│   │   ├── gtd-lld-writer.md
│   │   ├── gtd-capacity-writer.md
│   │   ├── gtd-sysdesign-writer.md
│   │   ├── gtd-api-doc-writer.md
│   │   ├── gtd-runbook-writer.md
│   │   ├── gtd-accuracy-verifier.md
│   │   ├── gtd-completeness-auditor.md
│   │   └── gtd-doc-reviewer.md
│   ├── sync/                    # Sync pipeline agents
│   │   ├── gtd-drift-detector.md
│   │   ├── gtd-reconciliation-planner.md
│   │   └── gtd-alignment-auditor.md
│   └── shared/                  # Shared utility agents
│       └── gtd-diagram-generator.md
├── commands/                    # User-facing command files
│   └── gtd/
│       ├── forward/             # Forward commands
│       │   ├── new-project.md   # /gtd-new-project — Initialize new project
│       │   ├── plan-phase.md    # /gtd-plan-phase — Plan a phase
│       │   ├── execute-phase.md # /gtd-execute-phase — Execute a phase
│       │   ├── deploy-local.md  # /gtd-deploy-local — Deploy locally
│       │   ├── test-phase.md    # /gtd-test-phase — Run tests
│       │   └── ship.md          # /gtd-ship — Ship to production
│       ├── backward/            # Backward commands
│       │   ├── scan.md          # /gtd-scan — Map codebase
│       │   ├── analyze.md       # /gtd-analyze — Deep analysis
│       │   ├── create-tdd.md    # /gtd-create-tdd
│       │   ├── create-hld.md    # /gtd-create-hld
│       │   ├── create-lld.md    # /gtd-create-lld
│       │   ├── create-capacity.md   # /gtd-create-capacity
│       │   ├── create-sysdesign.md  # /gtd-create-sysdesign
│       │   ├── create-api-docs.md   # /gtd-create-api-docs
│       │   ├── create-runbook.md    # /gtd-create-runbook
│       │   ├── create-all.md    # /gtd-create-all — Full suite
│       │   ├── update.md        # /gtd-update — Incremental update
│       │   ├── review.md        # /gtd-review — Review documents
│       │   ├── verify.md        # /gtd-verify — Accuracy check
│       │   └── diff.md          # /gtd-diff — What changed since last gen
│       ├── sync/                # Sync commands
│       │   ├── drift.md         # /gtd-drift — Detect spec-code drift
│       │   ├── reconcile.md     # /gtd-reconcile — Reconcile differences
│       │   ├── sync.md          # /gtd-sync — Full bidirectional sync
│       │   └── audit.md         # /gtd-audit — Alignment audit
│       ├── status.md            # /gtd-status — Pipeline progress
│       ├── help.md              # /gtd-help
│       └── settings.md          # /gtd-settings
├── workflows/                   # Orchestration logic
│   ├── forward/
│   │   ├── research-project.md
│   │   ├── plan-phase.md
│   │   ├── execute-phase.md
│   │   ├── deploy-local.md
│   │   ├── test-phase.md
│   │   └── ship.md
│   ├── backward/
│   │   ├── scan-codebase.md
│   │   ├── analyze-architecture.md
│   │   ├── generate-document.md
│   │   ├── review-document.md
│   │   ├── verify-accuracy.md
│   │   ├── incremental-update.md
│   │   └── create-all.md
│   ├── sync/
│   │   ├── detect-drift.md
│   │   ├── reconcile.md
│   │   └── audit-alignment.md
│   └── ...
├── references/                  # Shared knowledge documents
│   ├── document-standards.md
│   ├── analysis-patterns.md
│   ├── language-analyzers.md
│   ├── framework-signatures.md
│   ├── diagram-conventions.md
│   ├── verification-patterns.md
│   └── template-schemas.md
├── templates/                   # Document templates
│   ├── tdd/
│   ├── hld/
│   ├── lld/
│   ├── capacity/
│   ├── system-design/
│   ├── api-docs/
│   ├── runbook/
│   └── formats/
│       ├── enterprise.md
│       ├── startup.md
│       └── compliance.md
└── contexts/                    # Context loading profiles
    ├── analysis.md
    ├── writing.md
    └── review.md
```

### 6.2 Data Flow

```
User: /gtd-create-tdd
         │
         ▼
┌─────────────────┐    ┌─────────────────────┐
│ Command Layer   │───>│ gtd-tools.cjs init  │
│ create-tdd.md   │    │ (load state, config) │
└────────┬────────┘    └─────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Workflow: generate-document.md  │
│                                 │
│ Step 1: Check analysis cache    │
│   └─ If stale -> re-run scan   │
│                                 │
│ Step 2: Spawn analyzer agents   │
│   ├─ architecture-analyzer      │
│   ├─ pattern-detector           │
│   ├─ data-flow-tracer           │
│   └─ dependency-analyzer        │
│                                 │
│ Step 3: Spawn TDD writer agent  │
│   └─ Reads analysis + template  │
│   └─ Produces draft TDD         │
│                                 │
│ Step 4: Spawn accuracy verifier │
│   └─ Cross-references code      │
│   └─ Flags inaccuracies         │
│                                 │
│ Step 5: Human review gate       │
│   └─ Present draft to user      │
│   └─ Collect feedback           │
│                                 │
│ Step 6: Finalize & write        │
│   └─ Apply feedback             │
│   └─ Write to .planning/        │
└─────────────────────────────────┘
```

---

## 7. Agent Model

### 7.1 Agent Categories

GTD has **33 agents** across three pipelines:

| Pipeline | Category | Count | Agents | Purpose |
|----------|----------|-------|--------|---------|
| **Forward** | Researchers | 3 | project-researcher, phase-researcher, research-synthesizer | Research and context gathering |
| **Forward** | Planners | 3 | roadmapper, planner, plan-checker | Roadmap and phase planning |
| **Forward** | Executors | 3 | executor, code-reviewer, deployer | Code generation, review, and deployment |
| **Forward** | Testers | 3 | verifier, test-runner, debugger | Testing and debugging |
| **Backward** | Mappers | 1 | codebase-mapper | Scan and index project structure |
| **Backward** | Analyzers | 6 | architecture-analyzer, api-extractor, pattern-detector, data-flow-tracer, dependency-analyzer, security-scanner | Deep code understanding |
| **Backward** | Writers | 7 | tdd-writer, hld-writer, lld-writer, capacity-writer, sysdesign-writer, api-doc-writer, runbook-writer | Document generation |
| **Backward** | Verifiers | 3 | accuracy-verifier, completeness-auditor, doc-reviewer | Quality assurance |
| **Backward** | Utilities | 1 | diagram-generator | Mermaid/ASCII diagram creation |
| **Sync** | Sync | 3 | drift-detector, reconciliation-planner, alignment-auditor | Drift detection and reconciliation |
| | **Total** | **33** | | |

### 7.2 Agent Definition Format

Each agent is a Markdown file with YAML frontmatter:

```yaml
---
name: gtd-architecture-analyzer
description: Analyzes codebase architectural patterns, layers, and component relationships
tools:
  - Read
  - Bash
  - Grep
  - Glob
model_tier: sonnet
color: "#3B82F6"
max_context: 200000
---

<purpose>
Analyze the codebase to extract architectural patterns, component boundaries,
layer structure, and inter-service communication patterns.
</purpose>

<inputs>
- CODEBASE-MAP.md from scan phase
- config.json for project-specific settings
- Source files identified in the codebase map
</inputs>

<outputs>
- .planning/analysis/ARCHITECTURE-ANALYSIS.md
</outputs>

<process>
...detailed agent instructions...
</process>
```

### 7.3 Agent Orchestration Pattern

```
Orchestrator (Workflow)
    │
    ├── [Parallel] Spawn N analyzer agents with fresh context
    │   ├── Agent A: architecture-analyzer
    │   ├── Agent B: pattern-detector
    │   ├── Agent C: data-flow-tracer
    │   └── Agent D: dependency-analyzer
    │
    ├── [Sequential] Collect analysis artifacts from disk
    │
    ├── [Sequential] Spawn writer agent with analysis context
    │   └── Writer reads analysis/ + template -> produces draft
    │
    ├── [Sequential] Spawn verifier agent
    │   └── Verifier cross-checks draft against actual code
    │
    └── [Gate] Present to user for review
```

---

## 8. Document Generation Pipeline

### 8.1 Supported Document Types

| Document | Command | Agents Involved | Output |
|----------|---------|-----------------|--------|
| Technical Design Document | `/gtd-create-tdd` | architecture-analyzer, pattern-detector, tdd-writer | `documents/TDD.md` |
| High-Level Design | `/gtd-create-hld` | architecture-analyzer, data-flow-tracer, hld-writer | `documents/HLD.md` |
| Low-Level Design | `/gtd-create-lld` | pattern-detector, data-flow-tracer, lld-writer | `documents/LLD.md` |
| Capacity Plan | `/gtd-create-capacity` | dependency-analyzer, performance-profiler, capacity-writer | `documents/CAPACITY-PLAN.md` |
| System Design | `/gtd-create-sysdesign` | all analyzers, sysdesign-writer | `documents/SYSTEM-DESIGN.md` |
| API Documentation | `/gtd-create-api-docs` | api-extractor, api-doc-writer | `documents/API-DOCS.md` |
| Runbook | `/gtd-create-runbook` | dependency-analyzer, security-scanner, runbook-writer | `documents/RUNBOOK.md` |
| **All Documents** | `/gtd-create-all` | All agents, wave-based | `documents/*.md` |

### 8.2 Pipeline Stages

#### Stage 1: Discovery (Codebase Scan)
```
/gtd-scan
├── Language detection (polyglot support)
├── File tree indexing with .gitignore respect
├── Entry point identification
├── Framework/library fingerprinting
├── Build system detection
├── Infrastructure-as-code detection (Docker, K8s, Terraform)
├── CI/CD pipeline detection
├── Database schema extraction
└── Output: CODEBASE-MAP.md + analysis/FILE-INDEX.json
```

#### Stage 2: Analysis (Deep Understanding)
```
/gtd-analyze [--focus architecture|api|data|security|performance]
├── Architecture pattern recognition (MVC, microservices, event-driven, etc.)
├── Component boundary detection
├── API surface extraction (REST, GraphQL, gRPC, WebSocket)
├── Data flow tracing (request lifecycle, event propagation)
├── Dependency graph construction
├── Security surface mapping
├── Performance hotspot identification
└── Output: analysis/*.md (one per analysis dimension)
```

#### Stage 3: Generation (Document Drafting)
```
/gtd-create-<type>
├── Load analysis cache + template
├── Spawn specialized writer agent
├── Writer produces structured draft following template
├── Spawn diagram generator for visual elements
├── Inject diagrams into draft
└── Output: documents/<TYPE>-DRAFT.md
```

#### Stage 4: Verification (Accuracy Check)
```
/gtd-verify [document]
├── Cross-reference claims against actual code
├── Verify file paths and line references
├── Check diagram accuracy
├── Validate configuration values
├── Flag stale or incorrect sections
└── Output: VERIFICATION-REPORT.md with pass/fail per section
```

#### Stage 5: Finalization
```
/gtd-review [document]
├── Present draft with verification results
├── User provides feedback
├── Apply revisions
├── Final formatting and TOC generation
├── Version stamp
└── Output: documents/<TYPE>.md (final)
```

---

## 9. CLI and Command System

### 9.1 Forward Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `/gtd-new-project` | Initialize a new project with requirements and roadmap | `--template <type>`, `--name <name>` |
| `/gtd-plan-phase` | Plan a specific phase from the roadmap | `--phase <number>`, `--auto` |
| `/gtd-execute-phase` | Execute a planned phase (generate code) | `--phase <number>`, `--auto`, `--review` |
| `/gtd-deploy-local` | Deploy artifacts locally for testing | `--port <port>`, `--env <env>` |
| `/gtd-test-phase` | Run tests for a phase | `--phase <number>`, `--coverage` |
| `/gtd-ship` | Ship to production | `--phase <number>`, `--dry-run` |

### 9.2 Backward Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `/gtd-scan` | Map codebase structure | `--deep`, `--include-tests`, `--language <lang>` |
| `/gtd-analyze` | Deep code analysis | `--focus <area>`, `--force-refresh` |
| `/gtd-create-tdd` | Generate Technical Design Doc | `--format <enterprise\|startup>`, `--auto` |
| `/gtd-create-hld` | Generate High-Level Design | `--format`, `--auto` |
| `/gtd-create-lld` | Generate Low-Level Design | `--module <name>`, `--format`, `--auto` |
| `/gtd-create-capacity` | Generate Capacity Plan | `--format`, `--auto` |
| `/gtd-create-sysdesign` | Generate System Design Doc | `--format`, `--auto` |
| `/gtd-create-api-docs` | Generate API Documentation | `--format <openapi\|markdown>`, `--auto` |
| `/gtd-create-runbook` | Generate Ops Runbook | `--format`, `--auto` |
| `/gtd-create-all` | Generate all documents | `--format`, `--auto`, `--parallel` |
| `/gtd-update` | Incremental doc update | `--since <commit>`, `--doc <type>` |
| `/gtd-review` | Review generated docs | `<document>` |
| `/gtd-verify` | Verify doc accuracy | `<document>`, `--strict` |
| `/gtd-diff` | Show code changes since last gen | `--doc <type>` |

### 9.3 Sync Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `/gtd-drift` | Detect spec-code drift | `--scope <all\|phase\|doc>`, `--threshold <pct>` |
| `/gtd-reconcile` | Reconcile detected differences | `--strategy <code-wins\|spec-wins\|merge>`, `--auto` |
| `/gtd-sync` | Full bidirectional sync (drift + reconcile) | `--auto`, `--dry-run` |
| `/gtd-audit` | Audit alignment between code and docs | `--strict`, `--report` |

### 9.4 General Commands

| Command | Description | Flags |
|---------|-------------|-------|
| `/gtd-status` | Pipeline status dashboard | |
| `/gtd-help` | Help and guidance | |
| `/gtd-settings` | Configuration management | |

### 9.5 CLI Tools Layer

`gtd-tools.cjs` provides programmatic access to state and config:

```bash
# Initialize workflow context
node gtd-tools.cjs init <workflow> [args]

# Get configuration
node gtd-tools.cjs config-get <key>

# Template operations
node gtd-tools.cjs template fill <type> [vars]

# Analysis cache operations
node gtd-tools.cjs analysis status
node gtd-tools.cjs analysis get <dimension>

# State management
node gtd-tools.cjs state get
node gtd-tools.cjs state update <key> <value>

# Document management
node gtd-tools.cjs doc list
node gtd-tools.cjs doc status <type>
node gtd-tools.cjs doc version <type>

# Forward pipeline
node gtd-tools.cjs phase list
node gtd-tools.cjs phase status <number>
node gtd-tools.cjs deploy status

# Sync operations
node gtd-tools.cjs drift status
node gtd-tools.cjs drift report
```

---

## 10. Runtime Abstraction Layer

### 10.1 Supported Runtimes

| Runtime | Command Format | Agent Spawning | Install Location |
|---------|---------------|----------------|-----------------|
| Claude Code | `/gtd-*` skills | `Task(subagent_type=...)` | `~/.claude/skills/gtd-*/` |
| OpenCode | `/gtd-*` | Sequential inline | `~/.config/opencode/` |
| Gemini CLI | `/gtd-*` | Sequential inline | `~/.gemini/` |
| Codex | `$gtd-*` | Skills-based | `~/.codex/` |
| Copilot | `/gtd-*` | Sequential inline | `~/.github/` |
| Cursor | `/gtd-*` | Sequential inline | `~/.cursor/` |
| Windsurf | `/gtd-*` | Sequential inline | `~/.codeium/windsurf/` |
| Augment | `/gtd-*` | Sequential inline | `~/.augment/` |
| Cline | `.clinerules` | Sequential inline | `.clinerules` |

### 10.2 Installer

```bash
npx get-things-done@latest
```

Interactive prompts:
1. **Runtime** — Select target AI coding tool (multi-select supported)
2. **Location** — Global (all projects) or local (current project)
3. **Template Format** — Enterprise, Startup, or Compliance

---

## 11. File System Layout

### 11.1 Installed Framework Files

```
~/.claude/                          # (or equivalent per runtime)
├── skills/gtd-*/SKILL.md          # Command entry points
└── get-things-done/
    ├── bin/gtd-tools.cjs
    ├── agents/*.md
    ├── workflows/*.md
    ├── references/*.md
    ├── templates/**/*.md
    └── contexts/*.md
```

### 11.2 Project-Level Output

```
<project-root>/
└── .planning/
    ├── config.json                 # GTD configuration
    ├── STATE.md                    # Pipeline state
    │
    ├── # ── Forward Pipeline ──
    ├── REQUIREMENTS.md             # Project requirements
    ├── ROADMAP.md                  # Phase-based roadmap
    ├── phases/
    │   ├── phase-1/
    │   │   ├── PLAN.md             # Phase plan
    │   │   ├── CHECKLIST.md        # Execution checklist
    │   │   └── TEST-RESULTS.md     # Test results
    │   ├── phase-2/
    │   │   └── ...
    │   └── ...
    │
    ├── # ── Backward Pipeline ──
    ├── CODEBASE-MAP.md             # Project structure map
    ├── analysis/
    │   ├── ARCHITECTURE-ANALYSIS.md
    │   ├── API-SURFACE.md
    │   ├── DATA-FLOW.md
    │   ├── DEPENDENCY-GRAPH.md
    │   ├── PATTERN-ANALYSIS.md
    │   ├── SECURITY-SURFACE.md
    │   └── FILE-INDEX.json
    ├── documents/
    │   ├── TDD.md
    │   ├── HLD.md
    │   ├── LLD.md
    │   ├── CAPACITY-PLAN.md
    │   ├── SYSTEM-DESIGN.md
    │   ├── API-DOCS.md
    │   └── RUNBOOK.md
    ├── drafts/                     # Work-in-progress
    ├── verification/               # Verification reports
    ├── history/                    # Document version history
    │
    ├── # ── Sync Pipeline ──
    ├── DRIFT-REPORT.md             # Spec-code drift analysis
    │
    └── templates/                  # Local template overrides
```

---

## 12. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Installer | Node.js (CJS) | Cross-platform, npx-compatible, matches GSD/BMAD |
| CLI Tools | Node.js (CJS) | Runtime-compatible, no compilation needed |
| Agent Definitions | Markdown + YAML frontmatter | IDE-agnostic, human-readable |
| Workflows | Markdown with XML tags | LLM-optimized prompt format |
| Templates | Markdown with Mustache-like vars | Familiar, extensible |
| State | JSON + Markdown | Human-readable, git-friendly |
| SDK | TypeScript | Type safety for programmatic access |
| Diagrams | Mermaid.js syntax in Markdown | Renders in GitHub, IDEs, doc tools |

---

## 13. Security Considerations

| Concern | Mitigation |
|---------|------------|
| Sensitive code exposure in prompts | Config-based file exclusion patterns (`.env`, secrets) |
| LLM hallucination in docs | Accuracy verifier cross-references all claims against code |
| Document containing secrets | Secret scanner runs before finalization |
| Prompt injection via code comments | Prompt sanitizer strips suspicious patterns |
| Unauthorized code access | Respects `.gitignore` + configurable exclusion patterns |

---

## 14. Testing Strategy

| Test Type | Coverage |
|-----------|----------|
| Unit tests | CLI tools, template engine, state management |
| Integration tests | End-to-end document generation on sample projects |
| Forward pipeline tests | End-to-end project creation, planning, execution, and deployment |
| Sync tests | Drift detection accuracy, reconciliation correctness |
| Agent tests | Verify each agent produces expected output format |
| Accuracy tests | Generated docs verified against known codebase structure |
| Multi-runtime tests | Installer + command compatibility per runtime |
| Regression tests | Document output stability across framework versions |

---

## 15. Appendix: Comparison with GSD and BMAD

| Dimension | GSD | BMAD | GTD |
|-----------|-----|------|-----|
| **Direction** | Spec -> Code | Spec -> Code | Bidirectional: Spec <-> Code |
| **Primary Input** | User ideas, requirements | User ideas, PRD | Ideas (forward), existing codebase (backward), or both (sync) |
| **Primary Output** | Working software | Working software | Working software (forward) + Technical documentation (backward) + Alignment reports (sync) |
| **Agent Count** | 24 | 12+ | 33 |
| **Pipeline Flow** | Research -> Plan -> Execute -> Verify | Analyze -> Plan -> Architect -> Implement | Forward: Research -> Plan -> Execute -> Deploy -> Test + Backward: Map -> Analyze -> Write -> Verify + Sync: Drift -> Reconcile -> Audit |
| **State Location** | `.planning/` | `_bmad/` | `.planning/` |
| **Install Method** | `npx get-shit-done-cc@latest` | `npx bmad-method install` | `npx get-things-done@latest` |
| **Key Innovation** | Context engineering, fresh context per agent | Scale-adaptive, party mode | Bidirectional pipeline, drift detection, spec-code sync |
| **Runtimes** | 12 runtimes | Claude Code, Cursor | 9+ runtimes |
| **Forward (Idea->Code)** | Yes | Yes | Yes |
| **Backward (Code->Docs)** | No | No | Yes |
| **Sync (Drift Detection)** | No | No | Yes |

---

*End of Technical Design Document*
