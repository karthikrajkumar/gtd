# Get Things Done (GTD) - Capacity Planning Document

**Version:** 2.0.0
**Date:** 2026-04-10
**Status:** Draft

---

## Table of Contents

- [1. Overview](#1-overview)
- [2. Resource Consumption Model](#2-resource-consumption-model)
- [3. LLM Token Economics](#3-llm-token-economics)
- [4. Forward Pipeline Token Economics](#4-forward-pipeline-token-economics)
- [5. Codebase Size Tiers](#5-codebase-size-tiers)
- [6. Agent Resource Profiles](#6-agent-resource-profiles)
- [7. Pipeline Cost Projections](#7-pipeline-cost-projections)
- [8. Forward Pipeline Cost Projections](#8-forward-pipeline-cost-projections)
- [9. Sync Mode Cost](#9-sync-mode-cost)
- [10. Combined Pipeline Costs](#10-combined-pipeline-costs)
- [11. Context Window Budget Allocation](#11-context-window-budget-allocation)
- [12. File System Capacity](#12-file-system-capacity)
- [13. Time-to-Document Estimates](#13-time-to-document-estimates)
- [14. Scaling Strategies](#14-scaling-strategies)
- [15. Cost Optimization](#15-cost-optimization)
- [16. Monitoring and Alerting](#16-monitoring-and-alerting)

---

## 1. Overview

GTD is a bidirectional framework that runs entirely on the user's local machine, orchestrating LLM API calls through the AI coding runtime (Claude Code, Gemini CLI, etc.). Unlike the original backward-only pipeline (code to docs), GTD operates in three modes:

1. **Forward Pipeline** — Idea to code to deploy (research, plan, execute, verify, deploy)
2. **Backward Pipeline** — Code to documentation (analyze codebase, generate docs)
3. **Sync Mode** — Drift detection and reconciliation between code, specs, and docs

Capacity planning must account for all three pipelines. The primary capacity constraints are:

1. **LLM Token Budget** — API cost per pipeline run (forward, backward, or sync)
2. **Context Window** — Maximum tokens per agent invocation (128K-1M depending on model)
3. **Time** — Wall-clock time for multi-agent pipeline execution
4. **Disk Space** — Analysis cache, generated code, and generated document storage
5. **Codebase Size** — Files and lines of code that must be analyzed or generated

---

## 2. Resource Consumption Model

### 2.1 Per-Agent Resource Profile

Each agent consumes resources in three dimensions:

```
Agent Resource = Input Tokens + Output Tokens + Wall Time + File I/O

Where:
  Input Tokens  = System Prompt + Context Artifacts + Source Code Reads
  Output Tokens = Generated Analysis/Document/Code Content
  Wall Time     = API Latency + File I/O Time
  File I/O      = Source Files Read + Artifacts Written
```

### 2.2 Pipeline Resource Aggregation

```
Full Pipeline Cost = Σ(Agent_i × Concurrency_Factor)

Where:
  Parallel agents: cost is MAX(agent times), SUM(agent tokens)
  Sequential agents: cost is SUM(agent times), SUM(agent tokens)
```

---

## 3. LLM Token Economics

### 3.1 Token Pricing Reference (2026 Estimates)

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Context Window |
|-------|----------------------|----------------------|----------------|
| Claude Sonnet 4 | $3.00 | $15.00 | 200K |
| Claude Haiku 4 | $0.80 | $4.00 | 200K |
| Claude Opus 4 | $15.00 | $75.00 | 200K |
| Gemini 2.5 Pro | $1.25 | $10.00 | 1M |
| GPT-4.1 | $2.00 | $8.00 | 1M |

### 3.2 Backward Pipeline Token Consumption Per Agent Type

| Agent Type | Avg Input Tokens | Avg Output Tokens | Model Tier |
|-----------|-----------------|-------------------|------------|
| Codebase Mapper | 15,000 - 40,000 | 5,000 - 15,000 | Sonnet |
| Architecture Analyzer | 30,000 - 80,000 | 8,000 - 20,000 | Sonnet |
| API Extractor | 20,000 - 60,000 | 5,000 - 15,000 | Sonnet |
| Pattern Detector | 25,000 - 70,000 | 6,000 - 18,000 | Sonnet |
| Data Flow Tracer | 30,000 - 80,000 | 8,000 - 20,000 | Sonnet |
| Dependency Analyzer | 10,000 - 25,000 | 3,000 - 8,000 | Sonnet |
| Security Scanner | 20,000 - 50,000 | 5,000 - 12,000 | Sonnet |
| Performance Profiler | 25,000 - 60,000 | 5,000 - 15,000 | Sonnet |
| Document Writer (per doc) | 40,000 - 100,000 | 10,000 - 30,000 | Sonnet |
| Accuracy Verifier | 30,000 - 60,000 | 3,000 - 8,000 | Haiku |
| Completeness Auditor | 20,000 - 40,000 | 2,000 - 5,000 | Haiku |
| Diagram Generator | 10,000 - 25,000 | 3,000 - 8,000 | Haiku |

---

## 4. Forward Pipeline Token Economics

### 4.1 Forward Pipeline Token Consumption Per Agent Type

| Agent Type | Avg Input Tokens | Avg Output Tokens | Model Tier |
|-----------|-----------------|-------------------|------------|
| Project Researcher (x4) | 20,000 - 50,000 | 8,000 - 20,000 | Sonnet |
| Research Synthesizer | 30,000 - 60,000 | 5,000 - 15,000 | Sonnet |
| Roadmapper | 20,000 - 40,000 | 5,000 - 12,000 | Sonnet |
| Planner | 40,000 - 100,000 | 15,000 - 40,000 | Sonnet |
| Plan Checker | 30,000 - 60,000 | 5,000 - 10,000 | Haiku |
| Executor (per plan) | 50,000 - 150,000 | 20,000 - 80,000 | Sonnet |
| Verifier | 30,000 - 80,000 | 5,000 - 15,000 | Sonnet |
| Deployer | 15,000 - 30,000 | 3,000 - 8,000 | Haiku |
| Test Runner | 20,000 - 40,000 | 5,000 - 10,000 | Haiku |

---

## 5. Codebase Size Tiers

### 5.1 Tier Definitions

| Tier | Files | Lines of Code | Example |
|------|-------|---------------|---------|
| **Micro** | 1-5 | < 1,000 | Single utility, small script |
| **Small** | 5-50 | 1,000-10,000 | CLI tool, small web app |
| **Medium** | 50-500 | 10,000-100,000 | Standard SaaS application |
| **Large** | 500-5,000 | 100,000-1,000,000 | Enterprise application |
| **Enterprise** | 5,000+ | 1,000,000+ | Monorepo, platform |

### 5.2 Tier-Specific Behavior

| Tier | Scan Strategy | Analysis Strategy | Doc Strategy |
|------|--------------|-------------------|-------------|
| Micro | Full scan, all files | Single-pass analysis | Combined single document |
| Small | Full scan | Parallel analysis (4 agents) | Standard 5-doc set |
| Medium | Full scan with exclusions | Parallel analysis (6 agents) | Full 7-doc suite |
| Large | Module-chunked scan | Domain-decomposed analysis | Per-domain documents with index |
| Enterprise | Service-boundary scan | Per-service analysis | Service-level docs + integration maps |

### 5.3 File Reading Budget Per Tier

| Tier | Max Files Read per Agent | Max Lines per Agent | Chunking Strategy |
|------|--------------------------|---------------------|-------------------|
| Micro | All files | All lines | None needed |
| Small | 50 files | 10,000 lines | None needed |
| Medium | 100 files | 30,000 lines | Priority-based file selection |
| Large | 200 files | 50,000 lines | Module-boundary chunking |
| Enterprise | 150 per service | 40,000 per service | Service-boundary chunking + index |

---

## 6. Agent Resource Profiles

### 6.1 Detailed Per-Agent Budget

#### Codebase Mapper
```
Context Budget: 60K tokens max
├── System prompt:     3K tokens
├── Config + state:    1K tokens
├── File listing:      5-30K tokens (depends on project size)
├── Sample file reads: 10-20K tokens (representative files)
├── Reserved output:   5-15K tokens
└── Buffer:            5K tokens

File I/O:
├── Reads: file tree (all), sample files (10-30)
└── Writes: CODEBASE-MAP.md (1), FILE-INDEX.json (1)

Wall time: 30s - 3min
```

#### Architecture Analyzer
```
Context Budget: 120K tokens max
├── System prompt:         4K tokens
├── CODEBASE-MAP.md:       3-10K tokens
├── Source file reads:     50-80K tokens (20-50 key files)
├── Reserved output:       8-20K tokens
└── Buffer:                5K tokens

File I/O:
├── Reads: CODEBASE-MAP.md (1), source files (20-50)
└── Writes: ARCHITECTURE-ANALYSIS.md (1)

Wall time: 1-5min
```

#### Document Writer (TDD)
```
Context Budget: 150K tokens max
├── System prompt:         5K tokens
├── Template:              2-4K tokens
├── Analysis artifacts:    30-60K tokens (3-6 analyses)
├── CODEBASE-MAP.md:       3-10K tokens
├── Source file reads:     20-40K tokens (verification reads)
├── Reserved output:       10-30K tokens
├── Cross-ref other docs:  5-10K tokens
└── Buffer:                5K tokens

File I/O:
├── Reads: all analysis/*.md, CODEBASE-MAP.md, template, source files (10-20)
└── Writes: documents/TDD-DRAFT.md (1)

Wall time: 2-8min
```

### 6.2 Agent Concurrency Matrix

```
Pipeline Phase    │ Max Concurrent Agents │ Total Token Load
──────────────────┼───────────────────────┼─────────────────
Scan              │ 1 (mapper only)       │ 20-55K
Analysis          │ 6 (all analyzers)     │ 135-365K per wave
Writing           │ 1-3 (writers)         │ 50-150K per writer
Verification      │ 1 (verifier)          │ 33-68K
──────────────────┼───────────────────────┼─────────────────
Peak concurrent   │ 6 agents              │ ~365K tokens
```

---

## 7. Pipeline Cost Projections

### 7.1 Single Document Generation Cost (Backward Pipeline)

**Scenario: Generate TDD for a Medium project (200 files, 50K LOC)**

| Phase | Agents | Input Tokens | Output Tokens | Cost (Sonnet) |
|-------|--------|-------------|---------------|---------------|
| Scan (if needed) | 1 mapper | 35K | 10K | $0.25 |
| Analysis | 4 analyzers (parallel) | 200K | 50K | $1.35 |
| Draft | 1 TDD writer | 90K | 25K | $0.65 |
| Verify | 1 verifier (Haiku) | 50K | 5K | $0.06 |
| **Total** | **7 agents** | **375K** | **90K** | **$2.31** |

### 7.2 Full Documentation Suite Cost (Backward Pipeline)

**Scenario: Generate all 7 documents for a Medium project**

| Phase | Agents | Input Tokens | Output Tokens | Cost |
|-------|--------|-------------|---------------|------|
| Scan | 1 | 35K | 10K | $0.25 |
| Analysis | 6 (parallel) | 270K | 70K | $1.86 |
| Write 7 docs | 7 writers (sequential) | 630K | 175K | $4.52 |
| Verify 7 docs | 7 verifiers (Haiku) | 350K | 35K | $0.42 |
| **Total** | **21 agents** | **1,285K** | **290K** | **$7.05** |

### 7.3 Cost by Project Tier (Backward Pipeline)

| Tier | Single Doc | Full Suite | Incremental Update |
|------|-----------|------------|-------------------|
| Micro | $0.50 | $1.50 | $0.25 |
| Small | $1.20 | $3.50 | $0.50 |
| Medium | $2.30 | $7.00 | $1.00 |
| Large | $5.00 | $18.00 | $2.50 |
| Enterprise | $12.00 | $45.00 | $5.00 |

### 7.4 Monthly Cost Projections (Team Usage)

| Scenario | Frequency | Monthly Cost |
|----------|-----------|-------------|
| Solo dev, weekly backward updates | 4 incremental/month | $4-10 |
| Small team, bi-weekly full doc gen | 2 full + 8 incremental/month | $22-35 |
| Enterprise, CI integration (backward) | 20 incremental/month | $50-100 |
| Compliance audit, quarterly full | 1 full + 12 incremental/month | $19-32 |
| Solo dev, forward + backward weekly | 4 forward phases + 4 backward incremental/month | $30-80 |
| Small team, full lifecycle | 2 forward projects + 2 full backward + sync/month | $100-250 |
| Enterprise, continuous forward + backward + sync | Daily forward + weekly backward + daily sync | $300-800 |

---

## 8. Forward Pipeline Cost Projections

### 8.1 Forward Pipeline Cost Breakdown

| Operation | Cost Range | Details |
|-----------|-----------|---------|
| New project initialization | $3-8 | Research (4 researchers) + requirements + roadmap |
| Single phase (plan + execute + verify) | $5-15 | Planner + plan checker + executor + verifier |
| Full 8-phase project | $40-120 | All phases end-to-end |
| With local deploy + test (per phase) | add $2-5 | Deployer + test runner per phase |

### 8.2 Forward Pipeline Cost by Project Complexity

| Complexity | Phases | Estimated Total Cost |
|-----------|--------|---------------------|
| Simple (CLI tool, script) | 2-3 phases | $10-30 |
| Medium (web app, API service) | 5-6 phases | $30-80 |
| Complex (full-stack SaaS) | 8 phases | $40-120 |
| Complex + deploy/test | 8 phases + deploy/test | $56-160 |

---

## 9. Sync Mode Cost

### 9.1 Sync Operations Cost

| Operation | Cost Range | Details |
|-----------|-----------|---------|
| Drift detection | $1-3 | Lightweight analysis comparing code state vs specs/docs |
| Full reconciliation | $3-8 | Re-analyze changed areas + update specs and docs |
| Full audit | $5-15 | Comprehensive alignment check across all artifacts |

### 9.2 Recommended Sync Frequency

| Usage Pattern | Recommended Frequency | Monthly Sync Cost |
|--------------|----------------------|-------------------|
| Active development | Daily drift detection | $20-60 |
| Maintenance mode | Weekly drift detection | $4-12 |
| Pre-release | Full audit before each release | $5-15 per release |
| Compliance | Weekly reconciliation + monthly audit | $17-47 |

---

## 10. Combined Pipeline Costs

### 10.1 Full Lifecycle Cost Estimates

Full lifecycle: Forward build + Backward document + Sync = **$60-180 for a medium project**

| Project Size | Forward (build) | Backward (docs) | Sync (ongoing) | Total Lifecycle |
|-------------|-----------------|-----------------|----------------|-----------------|
| Micro | $10-20 | $1.50 | $2-5 | $14-26 |
| Small | $20-50 | $3.50 | $5-10 | $29-64 |
| Medium | $40-120 | $7.00 | $13-30 | $60-180 |
| Large | $80-250 | $18.00 | $25-60 | $123-328 |
| Enterprise | $200-600 | $45.00 | $50-120 | $295-765 |

---

## 11. Context Window Budget Allocation

### 11.1 200K Token Window (Claude Sonnet)

```
Total Available: 200,000 tokens
├── System Prompt + Framework:    5,000  (2.5%)
├── Workflow Instructions:        3,000  (1.5%)
├── Analysis Artifacts:          40,000  (20%)
├── Codebase Map:                 8,000  (4%)
├── Template:                     4,000  (2%)
├── Source Code Reads:           80,000  (40%)
├── Reserved for Output:         40,000  (20%)
└── Safety Buffer:               20,000  (10%)
```

### 11.2 1M Token Window (Gemini 2.5 Pro)

```
Total Available: 1,000,000 tokens
├── System Prompt + Framework:     5,000  (0.5%)
├── Workflow Instructions:         3,000  (0.3%)
├── Analysis Artifacts:          100,000  (10%)
├── Codebase Map:                 15,000  (1.5%)
├── Template:                      4,000  (0.4%)
├── Source Code Reads:           500,000  (50%)    ← Significantly more code
├── Cross-document Context:       50,000  (5%)     ← Can reference other docs
├── Reserved for Output:         200,000  (20%)
└── Safety Buffer:               123,000  (12.3%)
```

### 11.3 Adaptive Context Strategy

```
IF context_window >= 1,000,000:
  → Rich mode: read more files, include cross-references
  → Writers receive all analysis artifacts + prior documents
  → Single-pass generation (no chunking needed)

ELSE IF context_window >= 200,000:
  → Standard mode: selective file reading
  → Writers receive relevant analyses only
  → May chunk very large documents

ELSE IF context_window >= 128,000:
  → Compact mode: minimal file reading
  → Writers receive summarized analyses
  → Document sections generated independently
```

---

## 12. File System Capacity

### 12.1 Storage Requirements

| Component | Size Estimate | Growth Rate |
|-----------|--------------|-------------|
| Installed framework (global) | 2-5 MB | Per version update |
| CODEBASE-MAP.md | 5-50 KB | Per scan |
| FILE-INDEX.json | 10-200 KB | Per scan |
| Analysis artifacts (6 dimensions) | 50-500 KB | Per analysis run |
| Single document | 15-100 KB | Per generation |
| Full 7-document suite | 100-700 KB | Per generation |
| Verification reports | 10-50 KB each | Per verification |
| Document history (10 versions) | 1-7 MB | Per update cycle |
| **Total .planning/** | **2-15 MB** | **Low growth** |

### 12.2 History and Version Management

```
.planning/history/
├── TDD/
│   ├── v1.0_abc1234_2026-04-10.md     (50KB)
│   ├── v1.1_def5678_2026-04-17.md     (52KB)
│   └── v2.0_ghi9012_2026-05-01.md     (55KB)
├── HLD/
│   └── ...

Retention policy:
  - Keep last 10 versions per document (configurable)
  - Auto-prune on update
  - Total history budget: 50MB (configurable)
```

---

## 13. Time-to-Document Estimates

### 13.1 Backward Pipeline Wall-Clock Time by Operation

| Operation | Micro | Small | Medium | Large | Enterprise |
|-----------|-------|-------|--------|-------|-----------|
| `/gtd-scan` | 10s | 30s | 1-2min | 3-5min | 5-10min |
| `/gtd-analyze` | 30s | 1-2min | 3-6min | 8-15min | 15-30min |
| `/gtd-create-tdd` | 1min | 2-3min | 5-10min | 12-20min | 25-45min |
| `/gtd-create-all` | 3min | 8-12min | 20-40min | 45-90min | 90-180min |
| `/gtd-update` | 15s | 30s-1min | 1-3min | 3-8min | 5-15min |
| `/gtd-verify` | 15s | 30s | 1-2min | 2-5min | 5-10min |

### 13.2 Forward Pipeline Wall-Clock Time by Operation

| Operation | Estimated Time |
|-----------|---------------|
| `/gtd-new-project` | 5-15 min |
| `/gtd-plan-phase` | 3-8 min |
| `/gtd-execute-phase` | 5-30 min per phase (depends on complexity) |
| `/gtd-deploy-local` | 1-5 min |
| `/gtd-test-phase` | 1-10 min |
| Full project (8 phases) | 2-6 hours |

### 13.3 Time Breakdown by Pipeline Phase

**Medium project, single TDD generation (backward pipeline):**
```
Total: ~7 minutes
├── Init & state load:        5s   (1%)
├── Staleness check:         10s   (2%)
├── Analysis (4 parallel):  180s   (43%)
│   ├── architecture:       180s
│   ├── patterns:           150s
│   ├── data-flow:          170s
│   └── dependencies:        90s
├── Writing:                150s   (36%)
├── Verification (Haiku):    60s   (14%)
└── State update:             5s   (1%)
```

### 13.4 Parallelization Impact

| Configuration | Analysis Phase Time | Total Time (TDD) |
|--------------|--------------------|--------------------|
| Sequential (parallelization: false) | 590s | ~12min |
| Parallel 4-way (default) | 180s | ~7min |
| Parallel with worktrees | 160s | ~6.5min |

---

## 14. Scaling Strategies

### 14.1 Large Codebase Strategy

```
Problem: > 500 files, can't read all in one agent context

Strategy: Domain-Decomposed Analysis
1. Scan identifies module boundaries (top-level dirs or package.json workspaces)
2. Each module analyzed independently by separate agent instances
3. Cross-module integration analyzer runs after per-module analysis
4. Writer receives module summaries + integration analysis

Example for monorepo:
  apps/web/     → Module analyzer 1
  apps/api/     → Module analyzer 2
  packages/     → Module analyzer 3
  infra/        → Module analyzer 4
  Integration   → Cross-module analyzer (reads summaries from 1-4)
```

### 14.2 Enterprise Monorepo Strategy

```
Problem: 50+ services, millions of LOC

Strategy: Service-Boundary Documents
1. Scan identifies service boundaries (docker-compose, k8s deployments)
2. Each service gets its own document set (TDD, HLD, etc.)
3. Platform-level integration document generated from service summaries
4. Shared library documentation extracted separately

Output structure:
  .planning/
  ├── services/
  │   ├── user-service/
  │   │   ├── TDD.md
  │   │   ├── HLD.md
  │   │   └── API-DOCS.md
  │   ├── order-service/
  │   │   └── ...
  │   └── payment-service/
  │       └── ...
  ├── platform/
  │   ├── INTEGRATION-MAP.md
  │   ├── SYSTEM-DESIGN.md
  │   └── CAPACITY-PLAN.md
  └── shared/
      └── SHARED-LIBRARIES.md
```

### 14.3 Context Window Optimization

```
Strategy: Progressive Detail Loading

Phase 1 (low context): Load CODEBASE-MAP.md + FILE-INDEX.json
  → Agent knows WHAT exists but hasn't read code

Phase 2 (targeted reads): Based on task, agent requests specific files
  → Read only files relevant to current analysis dimension
  → Prioritize: entry points → core modules → utilities → tests

Phase 3 (deep dives): For specific sections, read implementation details
  → Follow import chains for data flow
  → Read tests for behavior understanding
  → Read configs for deployment context
```

---

## 15. Cost Optimization

### 15.1 Optimization Strategies

| Strategy | Savings | Trade-off |
|----------|---------|-----------|
| **Analysis caching** | 40-60% on re-runs | Stale risk if cache key is imprecise |
| **Haiku for verification** | 70% vs Sonnet | Slightly less nuanced accuracy checks |
| **Incremental updates** | 60-80% vs full regen | May miss cross-section impacts |
| **Shallow analysis depth** | 30-50% | Less detailed documents |
| **Skip verification** | 15% | Accuracy risk |
| **Combined single-doc** | 50% vs full suite | Less structured output |
| **File read budget limits** | 20-30% | May miss edge-case components |

### 15.2 Model Tier Allocation

```
Cost-Optimized Profile:
  Mapper:           Haiku     (structure detection doesn't need Sonnet)
  Analyzers:        Sonnet    (core intelligence, needs quality)
  Writers:          Sonnet    (document quality matters)
  Verifiers:        Haiku     (pattern matching, cross-referencing)
  Diagram gen:      Haiku     (structured output, lower complexity)

  Estimated savings vs all-Sonnet: ~25%

Quality-Maximized Profile:
  Mapper:           Sonnet
  Analyzers:        Opus      (deepest analysis)
  Writers:          Opus      (highest quality prose)
  Verifiers:        Sonnet
  Diagram gen:      Sonnet

  Estimated cost increase vs standard: ~4x
```

### 15.3 Budget Guard Rails

```javascript
// SDK budget enforcement
const MAX_BUDGET_DEFAULTS = {
  single_doc: 5.00,    // $5 max for one document
  full_suite: 25.00,   // $25 max for all documents
  incremental: 3.00,   // $3 max for incremental update
  forward_phase: 20.00, // $20 max for single forward phase
  full_project: 200.00, // $200 max for full forward project
  sync_audit: 20.00,    // $20 max for full sync audit
};

// Track cumulative cost during pipeline
if (cumulativeCost > budget * 0.8) {
  warn("Approaching budget limit (80%). Remaining: $" + (budget - cumulativeCost));
}
if (cumulativeCost > budget) {
  abort("Budget limit reached. Generated partial results saved to drafts/");
}
```

---

## 16. Monitoring and Alerting

### 16.1 Pipeline Metrics

| Metric | Tracked In | Purpose |
|--------|-----------|---------|
| Tokens consumed (in/out per agent) | STATE.md metrics section | Cost tracking |
| Wall-clock time per agent | STATE.md metrics section | Performance baseline |
| Analysis cache hit rate | STATE.md metrics section | Efficiency tracking |
| Verification pass rate | Verification reports | Quality tracking |
| Stale document count | STATE.md document table | Freshness monitoring |
| Files analyzed vs total | Analysis frontmatter | Coverage tracking |
| Drift detection results | STATE.md sync section | Alignment monitoring |

### 16.2 Health Dashboard (`/gtd-status`)

```
╔═══════════════════════════════════════════════╗
║           GTD Pipeline Status                 ║
╠═══════════════════════════════════════════════╣
║ Project: my-project                           ║
║ Codebase: 234 files, 52K LOC                  ║
║ Last Scan: 2026-04-10 @ abc1234               ║
║                                               ║
║ Forward Pipeline:                             ║
║  ✓ Phase 1-4   (completed)                    ║
║  ▶ Phase 5     (in progress)                  ║
║  - Phase 6-8   (pending)                      ║
║                                               ║
║ Analysis Cache:                               ║
║  ✓ Architecture   (current)                   ║
║  ✓ API Surface    (current)                   ║
║  ✓ Data Flow      (current)                   ║
║  ⚠ Dependencies   (stale - 3 files changed)  ║
║  ✓ Security       (current)                   ║
║  - Performance    (not yet analyzed)           ║
║                                               ║
║ Documents:                                    ║
║  ✓ TDD           v1.1  (current)              ║
║  ✓ HLD           v1.0  (current)              ║
║  ⚠ LLD           v1.0  (stale)               ║
║  - Capacity Plan  (not generated)             ║
║  ✓ System Design  v1.0  (current)             ║
║  ⚠ API Docs       v1.0  (stale)              ║
║  - Runbook        (not generated)             ║
║                                               ║
║ Sync Status:                                  ║
║  Last drift check: 2026-04-10                 ║
║  Drift detected: 2 files (minor)              ║
║                                               ║
║ Session Cost: $2.31 (7 agents, 465K tokens)   ║
╚═══════════════════════════════════════════════╝
```

---

*End of Capacity Planning Document*
