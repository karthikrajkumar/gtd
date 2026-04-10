# Get Things Done (GTD) - System Design Document

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft

---

## Table of Contents

- [1. System Architecture](#1-system-architecture)
- [2. Component Interaction Diagrams](#2-component-interaction-diagrams)
- [3. Agent Orchestration System](#3-agent-orchestration-system)
- [4. Data Flow Architecture](#4-data-flow-architecture)
- [5. Pipeline State Machine](#5-pipeline-state-machine)
- [6. Document Generation Engine](#6-document-generation-engine)
- [7. Codebase Analysis Engine](#7-codebase-analysis-engine)
- [8. Incremental Update System](#8-incremental-update-system)
- [9. Quality Assurance System](#9-quality-assurance-system)
- [10. Multi-Runtime Compatibility Layer](#10-multi-runtime-compatibility-layer)
- [11. Configuration and Extensibility](#11-configuration-and-extensibility)
- [12. SDK and CI/CD Integration](#12-sdk-and-cicd-integration)
- [13. Security Architecture](#13-security-architecture)
- [14. Failure Modes and Recovery](#14-failure-modes-and-recovery)
- [15. Forward Execution Engine](#15-forward-execution-engine)
- [16. Deploy and Test System](#16-deploy-and-test-system)
- [17. Drift Detection and Sync Engine](#17-drift-detection-and-sync-engine)
- [18. Evolution Roadmap](#18-evolution-roadmap)

---

## 1. System Architecture

### 1.1 Architecture Classification

GTD is a **bidirectional, agent-orchestrated, pipeline-based development and documentation framework**. It has no server component, no database, and no cloud dependency beyond the LLM API calls made by the AI coding runtime.

**Architecture Style:** Event-driven pipeline with file-based message passing
**Deployment Model:** npm package installed locally (global or per-project)
**Execution Model:** Command-triggered, multi-agent, with human gates

### 1.2 System Boundary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM BOUNDARY: GTD                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │               CONTROL PLANE                             │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │     │
│  │  │ Commands │  │Workflows │  │ State Machine     │     │     │
│  │  │ (entry)  │─>│ (orch)   │─>│ (pipeline ctrl)   │     │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │     │
│  └─────────────────────┬──────────────────────────────────┘     │
│                        │ spawn/collect                           │
│  ┌─────────────────────▼──────────────────────────────────┐     │
│  │               FORWARD PLANE                             │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │     │
│  │  │ Research │  │ Planning │  │   Execution      │     │     │
│  │  │  Agents  │  │  Agents  │  │   Agents         │     │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │     │
│  │  ┌──────────────────────────────────────────────┐     │     │
│  │  │         Deploy/Test Agents                    │     │     │
│  │  └──────────────────────────────────────────────┘     │     │
│  └─────────────────────┬──────────────────────────────────┘     │
│                        │ spawn/collect                           │
│  ┌─────────────────────▼──────────────────────────────────┐     │
│  │               DATA PLANE (Backward)                     │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │     │
│  │  │ Analyzer │  │  Writer  │  │   Verifier       │     │     │
│  │  │  Agents  │  │  Agents  │  │   Agents         │     │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │     │
│  └─────────────────────┬──────────────────────────────────┘     │
│                        │ detect/reconcile                        │
│  ┌─────────────────────▼──────────────────────────────────┐     │
│  │               SYNC PLANE                                │     │
│  │  ┌──────────────┐  ┌───────────────────┐  ┌─────────┐ │     │
│  │  │    Drift     │  │  Reconciliation   │  │Alignment│ │     │
│  │  │  Detector    │  │    Planner        │  │ Auditor │ │     │
│  │  └──────────────┘  └───────────────────┘  └─────────┘ │     │
│  └─────────────────────┬──────────────────────────────────┘     │
│                        │ read/write                              │
│  ┌─────────────────────▼──────────────────────────────────┐     │
│  │              PERSISTENCE PLANE                          │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │     │
│  │  │ Analysis │  │Documents │  │  State & Config   │     │     │
│  │  │  Cache   │  │          │  │                   │     │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              TOOLING PLANE                              │     │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐     │     │
│  │  │ CLI Tools│  │ Template │  │  Diff Engine      │     │     │
│  │  │ (CJS)    │  │  Engine  │  │                   │     │     │
│  │  └──────────┘  └──────────┘  └──────────────────┘     │     │
│  └────────────────────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼───────────────┐
        ▼              ▼               ▼
┌──────────────┐ ┌──────────┐  ┌──────────────┐
│ Source Code  │ │   Git    │  │ AI Runtime   │
│ (read/write) │ │          │  │ (LLM API)    │
└──────────────┘ └──────────┘  └──────────────┘
```

### 1.3 Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| P1 | **Code is the Source of Truth** | GTD reads code, never modifies it (backward mode). Documents reflect reality. |
| P2 | **Fresh Context Per Agent** | Every agent starts with a clean context window. No accumulated rot. |
| P3 | **File-Based Everything** | All state, config, artifacts, and communication lives on the file system. |
| P4 | **Verify Before Finalize** | No document is finalized without accuracy verification against code. |
| P5 | **Incremental by Default** | Updates only regenerate affected sections, not entire documents. |
| P6 | **Human Gates at Boundaries** | User approves before any document is finalized. |
| P7 | **Runtime Agnostic** | Framework works identically across all supported AI coding tools. |
| P8 | **Absent = Enabled** | Missing config keys default to their enabled/standard values. |
| P9 | **Bidirectional by Design** | Forward and backward pipelines share infrastructure, agents, and state tracking. |
| P10 | **Drift is Inevitable** | Sync mode assumes code will diverge from specs; continuous reconciliation is built-in. |
| P11 | **Deploy to Prove** | Local deployment validates what was built actually works before marking tasks complete. |

---

## 2. Component Interaction Diagrams

### 2.1 Full Pipeline Sequence

```
User        Command      Workflow     CLI Tools    Agents         File System
 │             │            │            │           │                │
 │ /gtd-create-tdd          │            │           │                │
 │────────────>│            │            │           │                │
 │             │ load workflow            │           │                │
 │             │───────────>│            │           │                │
 │             │            │ init       │           │                │
 │             │            │───────────>│           │                │
 │             │            │            │ load state│                │
 │             │            │            │──────────────────────────>│
 │             │            │            │<──────────────────────────│
 │             │            │<───────────│ context JSON              │
 │             │            │            │           │                │
 │             │            │ check analysis staleness│               │
 │             │            │───────────>│           │                │
 │             │            │<───────────│ stale: [arch, patterns]   │
 │             │            │            │           │                │
 │             │            │ spawn analyzers (parallel)              │
 │             │            │──────────────────────>│                │
 │             │            │            │          │ read source     │
 │             │            │            │          │───────────────>│
 │             │            │            │          │<───────────────│
 │             │            │            │          │ write analysis  │
 │             │            │            │          │───────────────>│
 │             │            │<─────────────────────│ complete        │
 │             │            │            │          │                │
 │             │            │ spawn TDD writer      │                │
 │             │            │──────────────────────>│                │
 │             │            │            │          │ read analysis   │
 │             │            │            │          │───────────────>│
 │             │            │            │          │ read template   │
 │             │            │            │          │───────────────>│
 │             │            │            │          │ read source     │
 │             │            │            │          │───────────────>│
 │             │            │            │          │ write draft     │
 │             │            │            │          │───────────────>│
 │             │            │<─────────────────────│ draft complete  │
 │             │            │            │          │                │
 │             │            │ spawn verifier        │                │
 │             │            │──────────────────────>│                │
 │             │            │            │          │ read draft      │
 │             │            │            │          │ read source     │
 │             │            │            │          │ write report    │
 │             │            │<─────────────────────│ verified        │
 │             │            │            │          │                │
 │ "Draft ready for review"│            │           │                │
 │<────────────│────────────│            │           │                │
 │             │            │            │           │                │
 │ "approved"  │            │            │           │                │
 │────────────>│───────────>│            │           │                │
 │             │            │ finalize   │           │                │
 │             │            │───────────>│           │                │
 │             │            │            │ move to documents/         │
 │             │            │            │──────────────────────────>│
 │             │            │            │ update STATE.md            │
 │             │            │            │──────────────────────────>│
 │ "TDD v1.0 saved."       │            │           │                │
 │<────────────│────────────│            │           │                │
```

### 2.2 Agent Communication Pattern

```
Agents DO NOT communicate directly with each other.
All communication is through FILE ARTIFACTS on disk.

┌──────────┐                        ┌──────────┐
│ Analyzer │                        │  Writer  │
│  Agent   │                        │  Agent   │
└────┬─────┘                        └────┬─────┘
     │                                    │
     │ writes                        reads│
     ▼                                    ▼
┌────────────────────────────────────────────┐
│          .planning/analysis/               │
│                                            │
│  ARCHITECTURE-ANALYSIS.md                  │
│  API-SURFACE.md                            │
│  DATA-FLOW.md                              │
│  DEPENDENCY-GRAPH.md                       │
│  PATTERN-ANALYSIS.md                       │
│  SECURITY-SURFACE.md                       │
└────────────────────────────────────────────┘

Benefits:
✓ No shared context → no rot
✓ Agents can be replaced independently
✓ Artifacts are inspectable and debuggable
✓ Survives agent crashes (partial results saved)
✓ Enables caching (artifacts persist across runs)
```

---

## 3. Agent Orchestration System

### 3.1 Orchestration Model

```
Workflow (Thin Orchestrator)
├── Reads STATE.md to determine pipeline position
├── Calls gtd-tools.cjs for context assembly
├── Makes spawn decisions based on:
│   ├── Which analyses are stale (cache check)
│   ├── Which agents are needed for this doc type
│   ├── Whether parallelization is enabled
│   └── Current model tier configuration
├── Spawns agents with fresh context:
│   ├── System prompt (agent definition)
│   ├── Task prompt (from workflow)
│   ├── Context artifacts (loaded from disk)
│   └── Tool permissions (from agent frontmatter)
├── Collects results from disk (not from agent return)
├── Runs quality gates (verification, completeness)
├── Presents results to user (human gate)
└── Updates STATE.md with results
```

### 3.2 Agent Spawn Protocol

```
For each agent spawn:

1. ASSEMBLE PROMPT
   system_prompt = read(agent_definition_file)
   task_prompt = workflow_step_instructions
   context = gtd-tools.cjs init <workflow> <args>

2. DETERMINE MODEL
   model = config.models[agent_category]
   If agent has model_override in frontmatter → use that

3. SPAWN
   Claude Code:
     Task(subagent_type="gtd-<agent-name>", prompt=task_prompt)
   
   Other runtimes:
     Sequential inline execution (read workflow, follow steps)

4. COLLECT RESULTS
   Wait for agent completion signal
   If timeout → check file system for partial output
   Read output artifact from disk
   Validate output format

5. HANDLE FAILURE
   If agent failed → retry once with reduced scope
   If retry failed → record gap, continue pipeline
```

### 3.3 Backward Wave-Based Execution

```
Wave 0: Prerequisites
├── Codebase Mapper (if scan is stale)
└── Output: CODEBASE-MAP.md, FILE-INDEX.json

Wave 1: Analysis (PARALLEL)
├── Architecture Analyzer
├── API Extractor
├── Pattern Detector
├── Data Flow Tracer
├── Dependency Analyzer
└── Security Scanner
    Output: analysis/*.md (6 artifacts)

Wave 2: Writing (SEQUENTIAL per document, PARALLEL across documents)
├── TDD Writer    → documents/TDD-DRAFT.md
├── HLD Writer    → documents/HLD-DRAFT.md
├── LLD Writer    → documents/LLD-DRAFT.md
├── ...
└── Diagram Generator (on-demand per writer)

Wave 3: Verification (SEQUENTIAL per document)
├── Accuracy Verifier → verification/TDD-VERIFICATION.md
├── Completeness Auditor → verification/TDD-COMPLETENESS.md
└── ...

Wave 4: Human Review Gate
├── Present drafts + verification results
├── Collect feedback
└── Apply revisions (may trigger Wave 2-3 replay for specific sections)

Wave 5: Finalization
├── Move drafts to documents/
├── Update STATE.md
└── Archive previous versions to history/
```

### 3.4 Forward Orchestration Pattern

```
Wave 0: Research (4 PARALLEL researchers)
├── Domain Researcher        → research/DOMAIN.md
├── Technology Researcher    → research/TECHNOLOGY.md
├── Architecture Researcher  → research/ARCHITECTURE.md
└── Patterns Researcher      → research/PATTERNS.md
    Output: research/*.md (4 artifacts)

Wave 1: Planning (SEQUENTIAL with revision loop)
├── Planner Agent           → plans/PLAN.md
├── Plan Checker Agent      → plans/PLAN-REVIEW.md
├── IF issues found:
│   ├── Planner revises     → plans/PLAN.md (updated)
│   └── Plan Checker re-checks → plans/PLAN-REVIEW.md (updated)
│   └── Loop until APPROVED or max 3 iterations
└── Output: approved PLAN.md with numbered tasks

Wave 2: Execution (PARALLEL executors per wave)
├── Wave grouping from plan (tasks with no dependencies run together)
├── Per task: spawn Executor Agent with fresh context
│   ├── Reads: PLAN.md (own task only), research artifacts, codebase
│   ├── Executes: code changes, file creation, configuration
│   └── Commits: atomic commit per plan task
├── Integration checkpoint between waves
│   ├── Verify no conflicts between parallel executors
│   └── Run build/lint to catch integration issues
└── Output: committed code changes, EXECUTION-LOG.md

Wave 3: Deploy + Test (SEQUENTIAL)
├── Build         → build artifacts
├── Deploy        → running service (local)
├── Health Check  → service responding
├── Smoke Test    → basic functionality verified
└── Output: DEPLOY-REPORT.md, TEST-RESULTS.md
```

---

## 4. Data Flow Architecture

### 4.1 Data Lineage

```
Source Code (read-only input)
    │
    ├──[Mapper]──> CODEBASE-MAP.md
    │                  │
    │   ┌──────────────┤
    │   │              │
    │   ▼              ▼
    ├──[Analyzers]──> analysis/ARCHITECTURE-ANALYSIS.md
    │                 analysis/API-SURFACE.md
    │                 analysis/DATA-FLOW.md
    │                 analysis/DEPENDENCY-GRAPH.md
    │                 analysis/PATTERN-ANALYSIS.md
    │                 analysis/SECURITY-SURFACE.md
    │                     │
    │   ┌─────────────────┤
    │   │                 │
    │   ▼                 ▼
    └──[Writers]──────> documents/TDD-DRAFT.md
                        documents/HLD-DRAFT.md
                        documents/LLD-DRAFT.md
                            │
                            ▼
       [Verifiers]──────> verification/*-REPORT.md
                            │
                            ▼
       [User Review]──> documents/TDD.md (final)
                        documents/HLD.md (final)
                        documents/LLD.md (final)
                            │
                            ▼
                        history/TDD/v1.0_*.md (archived)
```

### 4.2 Data Formats

| Artifact | Format | Schema | Size Range |
|----------|--------|--------|------------|
| CODEBASE-MAP.md | Markdown with YAML frontmatter | Structured sections | 5-50 KB |
| FILE-INDEX.json | JSON | JSON Schema defined | 10-200 KB |
| Analysis artifacts | Markdown with YAML frontmatter | Dimension-specific structure | 8-80 KB each |
| Document drafts | Markdown with metadata header | Template-defined structure | 15-100 KB |
| Verification reports | Markdown with tables | Claim-status pairs | 5-30 KB |
| STATE.md | Markdown with YAML frontmatter | State schema | 2-5 KB |
| config.json | JSON | Config schema | 1-2 KB |

---

## 5. Pipeline State Machine

### 5.1 Unified State Diagram

GTD tracks three independent pipelines in STATE.md: forward, backward, and sync.

```
FORWARD PIPELINE:
                    ┌─────────┐
          ┌────────>│  EMPTY  │
          │         └────┬────┘
          │              │ /gtd-research
          │              ▼
          │         ┌────────────┐
          │         │ RESEARCHED │
          │         └────┬───────┘
          │              │ /gtd-plan
          │              ▼
          │         ┌──────────┐
          │         │ PLANNED  │
          │         └────┬─────┘
          │              │ /gtd-execute
          │              ▼
          │         ┌───────────┐
          │         │ EXECUTING │
          │         └────┬──────┘
          │              │ execution complete
          │              ▼
          │         ┌──────────┐
          │         │ DEPLOYED │
          │         └────┬─────┘
          │              │ tests pass
          │              ▼
          │         ┌──────────┐
          │         │  TESTED  │
          │         └────┬─────┘
          │              │ verification pass
          │              ▼
          │         ┌──────────┐
          └─────────│ VERIFIED │
                    └──────────┘


BACKWARD PIPELINE:
                              ┌─────────┐
                    ┌────────>│  EMPTY  │
                    │         └────┬────┘
                    │              │ /gtd-scan
                    │              ▼
                    │         ┌─────────┐
                    │    ┌───>│ SCANNED │<──────────────────┐
                    │    │    └────┬────┘                    │
                    │    │         │ /gtd-analyze             │
                    │    │         ▼                          │
                    │    │    ┌──────────┐                    │
                    │    │    │ ANALYZED │<──────────┐        │
                    │    │    └────┬─────┘           │        │
                    │    │         │ /gtd-create-*    │        │
                    │    │         ▼                  │        │
              /gtd-scan  │    ┌──────────┐           │        │
              --force    │    │ DRAFTING │           │        │
                    │    │    └────┬─────┘           │        │
                    │    │         │ draft complete   │        │
                    │    │         ▼                  │        │
                    │    │    ┌──────────┐           │        │
                    │    │    │  REVIEW  │───────────┘        │
                    │    │    └────┬─────┘  (user rejects)    │
                    │    │         │ user approves             │
                    │    │         ▼                           │
                    │    │    ┌───────────┐                    │
                    └────┼────│ FINALIZED │                    │
                         │    └────┬──────┘                    │
                         │         │ code changes detected     │
                         │         ▼                           │
                         │    ┌─────────┐                      │
                         └────│  STALE  │──────────────────────┘
                              └─────────┘  /gtd-update


SYNC PIPELINE:
                    ┌──────────┐
          ┌────────>│  SYNCED  │<──────────┐
          │         └────┬─────┘           │
          │              │ drift detected   │
          │              ▼                  │
          │         ┌──────────┐           │
          │         │ DRIFTED  │           │
          │         └────┬─────┘           │
          │              │ /gtd-sync        │
          │              ▼                  │
          │         ┌──────────────┐       │
          └─────────│ RECONCILING  │───────┘
                    └──────────────┘
                      reconciliation
                        complete
```

### 5.2 Per-Document State (Backward)

Each document tracks its own state independently:

```
documents: {
  tdd: { status: "finalized", version: "1.1", commit: "abc1234" },
  hld: { status: "finalized", version: "1.0", commit: "abc1234" },
  lld: { status: "drafting",  version: null,  commit: null },
  capacity: { status: "pending", version: null, commit: null },
  ...
}
```

Document status values: `pending` | `analyzing` | `drafting` | `review` | `finalized` | `stale`

### 5.3 Per-Task State (Forward)

Each plan task tracks its own state independently:

```
forward: {
  pipeline: "executing",
  tasks: {
    "task-1": { status: "completed", commit: "def5678", wave: 1 },
    "task-2": { status: "completed", commit: "ghi9012", wave: 1 },
    "task-3": { status: "in-progress", commit: null, wave: 2 },
    "task-4": { status: "pending", commit: null, wave: 2 },
  }
}
```

Task status values: `pending` | `in-progress` | `completed` | `failed` | `skipped`

### 5.4 Sync State

```
sync: {
  status: "synced",
  lastCheck: "2026-04-10T14:30:00Z",
  driftReport: null,
  categories: {
    additions: 0,
    removals: 0,
    mutations: 0,
    structural: 0
  }
}
```

Sync status values: `synced` | `drifted` | `reconciling`

---

## 6. Document Generation Engine

### 6.1 Template Resolution Chain

```
User requests: /gtd-create-tdd --format enterprise

Template resolution:
1. Check: templates/tdd/enterprise.md        ← Format-specific
2. Check: templates/tdd/standard.md          ← Default format
3. Check: templates/tdd/default.md           ← Generic fallback
4. Error: "No template found for tdd"        ← Should never happen
```

### 6.2 Section-Analysis Mapping

Each document type has a defined mapping of sections to required analysis dimensions:

```
TDD Sections → Required Analysis:
  executive-summary       → architecture, patterns
  system-context          → architecture, dependencies
  architecture-overview   → architecture (primary)
  component-design        → architecture, patterns, data-flow
  data-model              → data-flow, api
  api-design              → api (primary)
  security-design         → security (primary)
  performance             → performance (primary)
  deployment              → architecture, dependencies
  dependencies            → dependencies (primary)
  error-handling          → patterns, data-flow
  monitoring              → architecture, performance
  testing                 → patterns
  limitations             → all dimensions (flags from each)
  appendix                → all dimensions (supplementary)
```

### 6.3 Diagram Generation Strategy

```
Diagrams embedded in documents:

Architecture diagram:
  Source: ARCHITECTURE-ANALYSIS.md component list
  Format: Mermaid flowchart or C4 diagram
  Embedding: ```mermaid ... ``` block in Markdown

Data flow diagram:
  Source: DATA-FLOW.md request lifecycle
  Format: Mermaid sequence diagram
  Embedding: ```mermaid ... ``` block

Dependency graph:
  Source: DEPENDENCY-GRAPH.md
  Format: Mermaid graph TD
  Embedding: ```mermaid ... ``` block

Entity-relationship diagram:
  Source: DATA-FLOW.md + API-SURFACE.md
  Format: Mermaid ER diagram
  Embedding: ```mermaid ... ``` block

Deployment diagram:
  Source: ARCHITECTURE-ANALYSIS.md infra section
  Format: Mermaid flowchart
  Embedding: ```mermaid ... ``` block
```

---

## 7. Codebase Analysis Engine

### 7.1 Language-Specific Analysis Strategies

| Language | Framework Detection | Entry Points | Module Boundaries |
|----------|-------------------|--------------|-------------------|
| TypeScript/JavaScript | package.json deps | main/module fields, index files | packages/, workspaces |
| Python | pyproject.toml, requirements.txt | main.py, app.py, manage.py | top-level packages |
| Go | go.mod | main.go, cmd/ | go packages |
| Rust | Cargo.toml | main.rs, lib.rs | cargo workspaces |
| Java | pom.xml, build.gradle | Main classes, @SpringBootApplication | Maven modules |
| C#/.NET | *.csproj, *.sln | Program.cs, Startup.cs | Solution projects |
| Ruby | Gemfile | config.ru, bin/ | gem structure |

### 7.2 Framework Fingerprinting Database

```yaml
# references/framework-signatures.md (embedded knowledge)

signatures:
  nextjs:
    indicators:
      - file: "next.config.*"
        confidence: 95
      - dependency: "next"
        confidence: 90
      - directory: "app/"
        with: "layout.tsx"
        confidence: 85
      - directory: "pages/"
        with: "index.tsx"
        confidence: 80
    architecture_pattern: "SSR + API routes"
    
  fastapi:
    indicators:
      - dependency: "fastapi"
        confidence: 95
      - pattern: "from fastapi import FastAPI"
        confidence: 90
      - pattern: "@app.get|@app.post|@router"
        confidence: 80
    architecture_pattern: "Async REST API"

  express:
    indicators:
      - dependency: "express"
        confidence: 95
      - pattern: "app.get\\(|app.post\\(|router.get\\("
        confidence: 85
    architecture_pattern: "REST API with middleware"
    
  # ... 30+ framework signatures
```

### 7.3 Analysis Depth Levels

```
Shallow (fast, low cost):
  - File tree structure only
  - Package manifest dependencies
  - No source code reading
  - No pattern detection
  Use for: Quick overview, CI staleness checks

Standard (balanced):
  - File tree + representative file reads (30-50 files)
  - Framework detection + config analysis
  - Top-level import graph
  - Pattern detection on key files
  Use for: Most document generation

Deep (thorough, high cost):
  - Full source code analysis (100+ files)
  - Complete import graph
  - Control flow analysis
  - Test coverage mapping
  - Security vulnerability patterns
  Use for: Enterprise audits, compliance documentation
```

---

## 8. Incremental Update System

### 8.1 Change Detection Algorithm

```
Input: since_commit (git hash or tag)
Output: { affected_dimensions[], affected_documents[], affected_sections[] }

Step 1: Get changed files
  files = git diff --name-only $since_commit..HEAD

Step 2: Classify changes
  For each file:
    type = classify(file)  // source, config, infra, test, docs
    dimensions = IMPACT_MAP[matching_pattern]

Step 3: Map to documents
  For each affected dimension:
    docs = DIMENSION_TO_SECTION[dimension]
    For each doc:
      sections = doc.affected_sections

Step 4: Deduplicate and score
  Group by document → sections
  Score each section by number of affecting changes
  Sort by impact score

Step 5: Return impact report
  {
    changed_files: 23,
    affected_dimensions: ["architecture", "api", "dependencies"],
    affected_documents: [
      { type: "tdd", sections: ["component-design", "api-design"], impact: "high" },
      { type: "api-docs", sections: ["*"], impact: "critical" },
    ]
  }
```

### 8.2 Section Patching Strategy

```
For each affected section:

1. Read current document
2. Extract section boundaries (between ## headers)
3. Read updated analysis for that dimension
4. Read changed source files relevant to section

5. Spawn writer agent with NARROW prompt:
   "Update ONLY section '{{section_name}}' of the {{doc_type}}.
    Current section content: {{current_section}}
    Updated analysis: {{new_analysis_excerpt}}
    Changed files: {{changed_files_list}}
    Do NOT modify other sections."

6. Replace section in document
7. Re-verify only patched section
8. Bump version (minor increment)
```

---

## 9. Quality Assurance System

### 9.1 Verification Pipeline

```
Document Draft
    │
    ▼
┌──────────────────────────────────────┐
│ PASS 1: Structural Verification      │
│ ✓ All template sections present      │
│ ✓ TOC matches actual sections        │
│ ✓ Mermaid diagrams parse correctly   │
│ ✓ Metadata header complete           │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│ PASS 2: Factual Verification         │
│ ✓ File paths exist on disk           │
│ ✓ Code snippets match source files   │
│ ✓ Config values are current          │
│ ✓ Dependency versions are accurate   │
│ ✓ API endpoints exist in code        │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│ PASS 3: Completeness Audit           │
│ ✓ All major components documented    │
│ ✓ All public APIs documented         │
│ ✓ Cross-references valid             │
│ ✓ No TODO/placeholder sections       │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│ PASS 4: Consistency Check            │
│ ✓ Terminology consistent across docs │
│ ✓ Diagram labels match prose         │
│ ✓ Version numbers consistent         │
│ ✓ No contradictions between docs     │
└───────────────┬──────────────────────┘
                │
                ▼
Verification Report (PASS/FAIL per check)
```

### 9.2 Quality Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| **Accuracy Score** | Verified claims / Total verifiable claims | > 95% |
| **Completeness Score** | Filled sections / Template sections | 100% |
| **Freshness Score** | 1 - (stale sections / total sections) | > 90% |
| **Cross-Reference Validity** | Valid refs / Total refs | 100% |
| **Diagram Accuracy** | Correct diagrams / Total diagrams | > 90% |

---

## 10. Multi-Runtime Compatibility Layer

### 10.1 Runtime Abstraction

```
┌─────────────────────────────────────────────┐
│           Runtime Abstraction Layer          │
├─────────────────────────────────────────────┤
│                                             │
│  Capabilities detected at install time:     │
│  ┌─────────────────────────────────────┐    │
│  │ can_spawn_agents: boolean           │    │
│  │ agent_spawn_method: "task" | "inline│    │
│  │ slash_command_format: "/" | "$"      │    │
│  │ skills_format: "SKILL.md" | ".md"   │    │
│  │ install_dir_pattern: string         │    │
│  │ supports_parallel: boolean          │    │
│  │ max_context_window: number          │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Runtime-specific adapters:                 │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ Claude Code  │  │  Gemini CLI  │        │
│  │  Adapter     │  │  Adapter     │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Copilot    │  │   Cursor     │        │
│  │  Adapter     │  │  Adapter     │        │
│  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  Windsurf    │  │   Codex      │        │
│  │  Adapter     │  │  Adapter     │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

### 10.2 Runtime-Specific Behavior

| Runtime | Agent Spawning | Command Format | Parallelization |
|---------|---------------|----------------|-----------------|
| Claude Code | `Task(subagent_type=...)` — native parallel | `/gtd-*` skills | Full parallel |
| Gemini CLI | Sequential inline | `/gtd-*` commands | Sequential only |
| Copilot | Sequential inline | `/gtd-*` commands | Sequential only |
| Cursor | Sequential inline | `/gtd-*` rules | Sequential only |
| Codex | Skills-based | `$gtd-*` | Partial parallel |
| OpenCode | Sequential inline | `/gtd-*` | Sequential only |

---

## 11. Configuration and Extensibility

### 11.1 Extension Points

```
1. Custom Document Types:
   User creates: templates/custom/my-doc-type/standard.md
   User creates: agents/gtd-my-doc-writer.md (optional)
   Run: /gtd-create-custom my-doc-type

2. Custom Analysis Dimensions:
   User creates: agents/gtd-my-analyzer.md
   User adds to config: analysis.dimensions: [..., "my-dimension"]
   Analysis artifacts written to: analysis/MY-DIMENSION.md

3. Custom Template Formats:
   User creates: templates/tdd/my-company.md
   Run: /gtd-create-tdd --format my-company

4. Organization Templates (shared):
   Publish to npm: @my-org/gtd-templates
   Install: /gtd-settings add-template-pack @my-org/gtd-templates
```

### 11.2 Hook System

```
Pre-scan hooks:
  Execute before codebase scan
  Use for: pre-processing, secret removal

Post-analysis hooks:
  Execute after analysis completes
  Use for: custom analysis augmentation

Pre-write hooks:
  Execute before document writing
  Use for: template injection, context augmentation

Post-finalize hooks:
  Execute after document finalization
  Use for: format conversion, publishing, notification
```

---

## 12. SDK and CI/CD Integration

### 12.1 CI/CD Pipeline Integration

```yaml
# .github/workflows/docs-update.yml
name: Update Technical Docs

on:
  push:
    branches: [main]
    paths-ignore:
      - '.planning/**'
      - '*.md'

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for diff

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install GTD SDK
        run: npm install get-things-done-sdk

      - name: Check and Update Docs
        run: node scripts/update-docs.mjs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit Updated Docs
        run: |
          git config user.name "GTD Bot"
          git config user.email "gtd@ci"
          git add .planning/
          git diff --cached --quiet || git commit -m "docs: auto-update technical documentation"
          git push
```

### 12.2 SDK Usage Patterns

```typescript
// scripts/update-docs.mjs
import { GTD } from 'get-things-done-sdk';

const gtd = new GTD({
  projectDir: process.cwd(),
  autoMode: true,
  maxBudgetUsd: 10.00,
  format: 'enterprise',
});

// Check staleness
const report = await gtd.checkStaleness();

if (report.staleDocuments.length === 0) {
  console.log('All documents are current.');
  process.exit(0);
}

console.log(`Stale documents: ${report.staleDocuments.map(d => d.type).join(', ')}`);

// Update stale documents
for (const staleDoc of report.staleDocuments) {
  console.log(`Updating ${staleDoc.type}...`);
  const result = await gtd.updateDocument(staleDoc.type);

  if (result.success) {
    console.log(`  ✓ Updated to v${result.version} (${result.verificationScore}% verified)`);
  } else {
    console.error(`  ✗ Failed: ${result.error?.messages.join(', ')}`);
  }
}
```

---

## 13. Security Architecture

### 13.1 Threat Model

| Threat | Vector | Mitigation |
|--------|--------|------------|
| Secret exposure in documents | Analysis reads .env, credentials | Config-based exclusion patterns + secret scanner |
| Prompt injection via code | Malicious comments in source code | Prompt sanitizer strips suspicious patterns |
| LLM hallucination | Incorrect claims in documents | Accuracy verifier cross-references all claims |
| Stale security info | Outdated vulnerability documentation | Incremental update with dependency change detection |
| Unauthorized access | Reading private repos in shared env | Respects .gitignore, file permission checks |

### 13.2 Secret Detection

```
Pre-finalization scanner checks for:
  - API keys (pattern: /[A-Za-z0-9_]{20,}/)
  - AWS keys (AKIA...)
  - Private keys (-----BEGIN)
  - Connection strings (postgres://..., mongodb://...)
  - JWT tokens
  - Environment variable values from .env files

Action on detection:
  - Block finalization
  - Report: "Document contains potential secrets at sections X, Y"
  - Require user acknowledgment to proceed
```

---

## 14. Failure Modes and Recovery

### 14.1 Failure Taxonomy

| Failure Mode | Detection | Recovery | Data Loss Risk |
|-------------|-----------|----------|---------------|
| Agent timeout | Spawn timeout exceeded | Retry once, then record partial | None (file-based) |
| Agent crash | No output artifact produced | Retry, fall back to skip | None |
| Context overflow | Token limit exceeded | Reduce scope, chunk analysis | None |
| File system full | Write failure | Warn user, suggest cleanup | None (atomic writes) |
| Git unavailable | Git command fails | Proceed without versioning | Version tracking only |
| Config corrupted | JSON parse failure | Fall back to defaults, warn | Config preferences |
| Analysis inconsistency | Verifier flags contradictions | Re-analyze affected dimension | None |
| Network failure (LLM) | API timeout/error | Retry with backoff, up to 3x | None |

### 14.2 Recovery Procedures

```
Pipeline interrupted mid-execution:

1. STATE.md records last successful step
2. On next /gtd-create-* command:
   a. Load STATE.md → detect incomplete pipeline
   b. Display: "Previous run was interrupted at <step>. Resume? (y/n)"
   c. If yes → resume from last successful step
   d. If no → restart from beginning

Analysis partially complete:

1. Completed analyses are cached and valid
2. Only re-run failed/missing dimensions
3. Writer receives whatever analysis is available
4. Gaps noted in document: "⚠ Section based on partial analysis"
```

---

## 15. Forward Execution Engine

### 15.1 Wave-Based Parallel Execution

The forward execution engine processes plan tasks in waves, where tasks within a wave have no dependencies on each other and can run in parallel.

```
Wave Assignment Algorithm:

1. Parse PLAN.md → extract tasks with dependencies
2. Topological sort → assign wave numbers
3. Tasks with no unmet dependencies → Wave N
4. After Wave N completes → reassess → Wave N+1

Execution per wave:
┌─────────────────────────────────────────────┐
│ Wave N                                       │
│                                              │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐│
│  │ Executor  │  │ Executor  │  │ Executor ││
│  │ Task 3    │  │ Task 4    │  │ Task 5   ││
│  │ (worktree)│  │ (worktree)│  │ (worktree)│
│  └─────┬─────┘  └─────┬─────┘  └─────┬────┘│
│        │              │              │      │
│        ▼              ▼              ▼      │
│  ┌──────────────────────────────────────┐   │
│  │     Integration Checkpoint           │   │
│  │  - Merge worktrees to main branch    │   │
│  │  - Run build/lint                     │   │
│  │  - Resolve any conflicts              │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 15.2 Executor Agent Spawning

```
For each plan task:

1. CREATE FRESH CONTEXT
   - Read PLAN.md (only the assigned task section)
   - Read relevant research artifacts
   - Read relevant source files (from codebase map)
   - NO prior execution context (fresh agent)

2. SPAWN IN WORKTREE (if parallel)
   git worktree add .planning/worktrees/task-N branch-task-N
   Executor works in isolated worktree
   No conflicts with other parallel executors

3. EXECUTE TASK
   - Make code changes as specified in plan
   - Follow coding standards from project config
   - Write to files within worktree

4. ATOMIC COMMIT
   git add -A
   git commit -m "feat(task-N): <plan task title>"
   One commit per plan task → clean history

5. REPORT COMPLETION
   Write task-N-result.md to .planning/execution/
   Include: files changed, tests affected, notes
```

### 15.3 Worktree Support

```
True parallel execution via git worktrees:

Main branch: feature/project-name
├── .planning/worktrees/task-1/  (git worktree)
├── .planning/worktrees/task-2/  (git worktree)
├── .planning/worktrees/task-3/  (git worktree)
└── Each worktree has its own branch

After wave completion:
1. Merge task branches into main feature branch
2. Resolve conflicts (if any)
3. Run integration checks
4. Clean up worktrees

Fallback (no worktree support):
  Sequential execution on main branch
  Each task commits directly
  No merge step needed
```

### 15.4 Integration Checkpoints

```
Between each wave:

1. MERGE
   For each completed task in wave:
     git merge task-N-branch --no-ff
   Resolve conflicts automatically where possible
   Flag manual conflicts for user resolution

2. BUILD CHECK
   Run: npm run build (or detected build command)
   If fails → identify breaking task → flag for revision

3. LINT CHECK
   Run: npm run lint (or detected lint command)
   Auto-fix where possible
   Flag unfixable issues

4. TEST CHECK (optional, configurable)
   Run: npm test
   Map failures to specific tasks
   Flag failing tasks for revision

5. PROCEED or HALT
   All checks pass → continue to next wave
   Critical failure → pause, report to user
```

---

## 16. Deploy and Test System

### 16.1 Deployment Method Detection

```
Detection algorithm (in priority order):

1. Check for Docker Compose:
   docker-compose.yml | docker-compose.yaml | compose.yml
   → Method: docker compose up -d

2. Check for Dockerfile:
   Dockerfile | Dockerfile.*
   → Method: docker build + docker run

3. Check package.json scripts:
   "start" → npm start
   "dev" → npm run dev
   "serve" → npm run serve

4. Check for Python:
   manage.py → python manage.py runserver
   app.py → python app.py
   main.py → python main.py

5. Check for Go:
   main.go → go run .
   cmd/server/ → go run ./cmd/server

6. Check for other:
   Makefile with "run" target → make run
   Procfile → parse and execute

Output: DEPLOY-CONFIG.md with detected method and ports
```

### 16.2 Build Pipeline

```
Build step (runs before deploy):

1. DETECT BUILD COMMAND
   package.json → "build" script → npm run build
   Makefile → "build" target → make build
   Cargo.toml → cargo build --release
   go.mod → go build ./...

2. EXECUTE BUILD
   Run detected build command
   Capture stdout/stderr
   Check exit code

3. BUILD VALIDATION
   If exit code != 0:
     Parse error output
     Map errors to source files
     Report: "Build failed: <error summary>"
     Halt deploy pipeline

4. ARTIFACT CHECK
   Verify expected build outputs exist
   (dist/, build/, target/, bin/)
```

### 16.3 Service Startup and Health Check

```
Startup sequence:

1. START SERVICE
   Execute detected deploy command
   Run in background (detached)
   Record PID for cleanup

2. HEALTH CHECK POLLING
   Poll: GET http://localhost:<port>/
   Also try: /health, /api/health, /healthz
   Interval: 2 seconds
   Timeout: 60 seconds (configurable)
   Success: HTTP 2xx or 3xx response

3. HEALTH CHECK RESULTS
   If healthy within timeout:
     Record: service_url, startup_time, pid
     Proceed to smoke tests
   If timeout exceeded:
     Check service logs for errors
     Report: "Service failed to start: <error>"
     Clean up process

4. PORT MANAGEMENT
   Default port detection from config files
   Port conflict detection (lsof -i :<port>)
   Auto-increment port if conflict detected
   Record actual port in DEPLOY-REPORT.md
```

### 16.4 Smoke Test Execution

```
Smoke test strategy:

1. BASIC CONNECTIVITY
   GET / → expect 2xx
   Verify response body is non-empty

2. API ENDPOINT TESTS (if API detected)
   For each endpoint in API-SURFACE.md:
     Send request with sample data
     Verify response status
     Verify response shape matches spec

3. STATIC ASSET TESTS (if frontend detected)
   GET /index.html → expect 2xx
   Check for JS/CSS bundle references
   Verify bundles load

4. RESULTS
   Write TEST-RESULTS.md:
     Total tests: N
     Passed: N
     Failed: N
     Details per test

5. CLEANUP
   Kill service process (PID)
   Remove any temporary containers
   Release ports
   Report final status
```

---

## 17. Drift Detection and Sync Engine

### 17.1 Drift Detection Algorithm

```
Input: specs (from .planning/), codebase (current state)
Output: DRIFT-REPORT.md with categorized drifts

Step 1: Parse Specifications
  Read all finalized specs from .planning/documents/
  Extract: components, APIs, data models, configurations
  Build: expected_state map

Step 2: Scan Code Reality
  Read current codebase (using analysis engine)
  Extract: actual components, APIs, data models, configs
  Build: actual_state map

Step 3: Compare
  For each item in expected_state:
    If missing from actual_state → REMOVAL drift
    If present but different → MUTATION drift
  For each item in actual_state:
    If missing from expected_state → ADDITION drift
  For structural changes (moved, renamed, reorganized):
    → STRUCTURAL drift

Step 4: Categorize and Score
  Each drift item gets:
    - category: ADDITION | REMOVAL | MUTATION | STRUCTURAL
    - severity: low | medium | high | critical
    - location: file path + line range
    - description: human-readable explanation
    - suggested_action: what to do about it
```

### 17.2 Drift Categories

```
ADDITION:
  Code contains something not in specs.
  Examples: new API endpoint, new component, new config option
  Default action: Update spec to include (code-wins)

REMOVAL:
  Spec describes something missing from code.
  Examples: documented API removed, component deleted
  Default action: Flag for review (could be intentional or a bug)

MUTATION:
  Code differs from spec description.
  Examples: API signature changed, data model field type changed
  Default action: Update spec to match code (code-wins)

STRUCTURAL:
  Organization or architecture changed.
  Examples: module renamed, directory restructured, service split
  Default action: Update spec structure (code-wins)
```

### 17.3 Reconciliation Strategies

```
Strategy 1: spec-wins (update code to match spec)
  Use when: spec is the authority (forward pipeline output)
  Action: Generate code patches to align with spec
  Safety: Requires user approval before applying

Strategy 2: code-wins (update spec to match code)
  Use when: code has evolved beyond spec (typical for backward pipeline)
  Action: Regenerate affected spec sections
  Safety: Auto-apply for low-severity, user approval for high

Strategy 3: interactive (user decides per drift)
  Use when: mixed authority or unclear intent
  Action: Present each drift with options:
    [S] Spec wins (update code)
    [C] Code wins (update spec)
    [I] Ignore (mark as accepted divergence)
    [D] Defer (revisit later)

Configuration in config.json:
  sync: {
    strategy: "code-wins",        // default strategy
    autoSync: false,               // run on every commit?
    severityThreshold: "medium",   // auto-apply below this
    excludePaths: ["test/", "scripts/"]
  }
```

### 17.4 Auto-Sync Configuration

```
Auto-sync modes:

1. MANUAL (default):
   User runs /gtd-sync explicitly
   Full control, no surprises

2. ON-COMMIT:
   Git hook triggers drift check after each commit
   Only reports drift (does not auto-fix)
   Notifies user of drift count

3. CONTINUOUS:
   Background watcher monitors file changes
   Drift check runs on save (debounced)
   Auto-applies code-wins for low-severity items
   Queues medium+ for user review

4. CI-INTEGRATED:
   Drift check runs in CI pipeline
   PR blocked if critical drift detected
   Drift report posted as PR comment
```

---

## 18. Evolution Roadmap

### 18.1 Version Roadmap

| Version | Features | Timeline |
|---------|----------|----------|
| **v1.0** | Backward pipeline: scan, analyze, generate docs, verify, CLI | MVP |
| **v1.5** | Forward pipeline: ideation, plan, execute, verify | +4 weeks |
| **v2.0** | Deploy + Test + Sync mode, drift detection, reconciliation | +8 weeks |
| **v2.5** | Enterprise features, compliance packs, organization templates, audit trail | +16 weeks |
| **v3.0** | MCP server mode, knowledge graph, multi-service analysis | +24 weeks |

### 18.2 Future Architecture Considerations

```
Potential Future Additions:

1. MCP Server Mode:
   GTD as an MCP server that any AI tool can call
   Tools: scan, analyze, generate, verify, update, execute, deploy, sync
   Benefits: runtime-agnostic without installer complexity

2. Document-as-Code Pipeline:
   Treat .planning/ as source of truth
   CI validation: docs must pass verification on merge
   PR comments: "This change would make TDD section 4 stale"

3. Knowledge Graph:
   Build semantic graph from analysis
   Enable natural language queries: "How does auth work?"
   Power context-aware code suggestions

4. Multi-Service Analysis:
   Analyze microservice architectures holistically
   Cross-service dependency tracking
   Distributed system documentation generation
```

---

*End of System Design Document*
