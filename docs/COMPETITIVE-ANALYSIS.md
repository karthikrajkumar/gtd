# Competitive Analysis: GTD vs GSD vs BMAD

> Deep comparative study of the three leading spec-driven agentic frameworks.
> Goal: identify concrete gaps in GTD and define the agents, commands, workflows,
> and infrastructure needed to reach parity with — and surpass — GSD and BMAD.

---

## 1. Framework Profiles at a Glance

| Dimension | **GTD** (Get Things Done) | **GSD** (Get Shit Done) | **BMAD** (Build More Architect Dreams) |
|---|---|---|---|
| GitHub Stars | New | 58.7k | 46k |
| npm package | `@karthikrajkumar.kannan/get-things-done` | `get-shit-done-cc` | `bmad-method` |
| Philosophy | Bidirectional (forward + backward + sync) | Forward-only with context engineering | Agile methodology with persona-based agents |
| Runtimes | 9 (Claude, Cursor, Gemini, OpenCode, Codex, Copilot, Windsurf, Augment, Cline) | 15 (adds Kilo, Antigravity, Trae, Qwen Code, CodeBuddy) | Tool-agnostic (Claude Code, Cursor, any IDE) |
| Agents | 33 | 33 subagents + 86 skills | 6 named personas + module extensions |
| Commands | 40 | 60+ | ~34 workflows as skills |
| Direction | Forward + Backward + Sync | Forward only | Forward only (planning-heavy) |
| MCP Server | Yes (19 tools, stdio) | GSD SDK CLI | No |
| Minimal Install | No | Yes (`--minimal`, 6 skills) | Yes (module-based) |
| Uninstaller | No | Yes (`--uninstall`) | Yes |
| Test Suite | 1,030+ tests | Has tests | Has tests |

---

## 2. What GSD Has That GTD Lacks

### 2.1 Session & State Management

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-pause-work` — create HANDOFF.json when stopping mid-phase | **Missing** | **P0** |
| `/gsd-resume-work` — restore from last session | **Missing** | **P0** |
| `/gsd-session-report` — generate session summary | **Missing** | **P1** |
| `STATE.md` with decisions, blockers, position as memory across sessions | Partial (STATE.md exists but basic) | **P1** |

**Why it matters:** Context rot is the #1 problem. When a user stops mid-phase and returns in a new context window, everything is lost. GSD solves this with explicit handoff/resume. GTD has no equivalent.

### 2.2 Quick & Fast Modes

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-quick` — ad-hoc task with GSD guarantees | **Missing** | **P0** |
| `/gsd-quick --discuss` — lightweight discussion first | **Missing** | **P0** |
| `/gsd-quick --research` — research before planning | **Missing** | **P0** |
| `/gsd-quick --full` — full pipeline in quick form | **Missing** | **P0** |
| `/gsd-quick --validate` — plan-check + verification only | **Missing** | **P0** |
| `/gsd-fast` — trivial inline tasks, skip planning entirely | **Missing** | **P0** |

**Why it matters:** Not every task needs the full discuss → plan → execute → verify ceremony. GSD recognizes this with two lighter paths. GTD forces the full pipeline or nothing.

### 2.3 Spiking & Sketching (Experimentation)

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-spike [idea]` — 2-5 throwaway experiments with Given/When/Then verdicts | **Missing** | **P1** |
| `/gsd-sketch [idea]` — 2-3 interactive HTML mockup variants | **Missing** | **P1** |
| `/gsd-spike-wrap-up` — package spike findings into project-local skill | **Missing** | **P1** |
| `/gsd-sketch-wrap-up` — package sketch design findings | **Missing** | **P1** |

**Why it matters:** Before committing to a plan, developers need to explore. GSD's spike/sketch commands let you run cheap experiments and then import findings into the planning process.

### 2.4 UI Design Commands

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-ui-phase [N]` — generate UI-SPEC.md for frontend phases | **Missing** | **P1** |
| `/gsd-ui-review [N]` — 6-pillar visual audit of implemented frontend code | **Missing** | **P1** |

### 2.5 Shipping & PR Workflow

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-ship [N] [--draft]` — create PR from verified phase work | **Missing** | **P0** |
| `/gsd-pr-branch` — create clean PR branch filtering `.planning/` commits | **Missing** | **P1** |
| Git branching strategies (none / phase / milestone) with templates | **Missing** | **P1** |
| Squash merge at milestone completion | **Missing** | **P2** |

### 2.6 Backlog, Threads & Seeds

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-plant-seed <idea>` — forward-looking ideas with trigger conditions | **Missing** | **P1** |
| `/gsd-add-backlog <desc>` — parking lot outside active sequence | **Missing** | **P1** |
| `/gsd-review-backlog` — promote backlog items to active milestone | **Missing** | **P1** |
| `/gsd-thread [name]` — persistent context threads across sessions | **Missing** | **P1** |
| `/gsd-add-todo [desc]` — capture idea for later | **Missing** | **P2** |
| `/gsd-check-todos` — list pending todos | **Missing** | **P2** |
| `/gsd-note <text>` — zero-friction idea capture | **Missing** | **P2** |
| `todos/` directory | **Missing** | **P2** |
| `threads/` directory | **Missing** | **P2** |
| `seeds/` directory | **Missing** | **P2** |

### 2.7 Autonomous Mode

| GSD Feature | GTD Status | Priority |
|---|---|---|
| Run phases N–M unattended (discuss → plan → execute → verify loop) | Exists as `/gtd-autonomous` command | Review needed |
| `/gsd-next` — auto-detect and run next step | Exists as `/gtd-next` | Review needed |
| `--chain` flag on discuss to auto-chain into plan+execute | **Missing** | **P1** |
| `--batch` flag on discuss to answer grouped questions at once | **Missing** | **P1** |

### 2.8 Workstreams & Workspaces

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-workstreams list/create/switch/complete` — parallel namespaced milestone work | **Missing** | **P1** |
| `/gsd-new-workspace` — isolated workspace with repo copies (worktrees or clones) | **Missing** | **P2** |
| `/gsd-list-workspaces` / `/gsd-remove-workspace` | **Missing** | **P2** |

### 2.9 Observability & Health

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-health [--repair]` — validate `.planning/` directory integrity | Exists as `/gtd-health` | Verify parity |
| `/gsd-stats` — project statistics (phases, plans, requirements, git metrics) | **Missing** | **P1** |
| `/gsd-forensics [desc]` — post-mortem investigation of failed workflow runs | **Missing** | **P1** |
| `/gsd-milestone-summary [version]` — comprehensive summary for team onboarding | **Missing** | **P2** |
| `/gsd-audit-uat` — find phases missing user acceptance testing | **Missing** | **P1** |
| `/gsd-audit-milestone` — verify milestone achieved its definition of done | **Missing** | **P1** |

### 2.10 Code Quality & Security

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-review` — cross-AI peer review of current phase | Exists as `/gtd-code-review` | Verify parity |
| `/gsd-secure-phase [N]` — security enforcement with threat-model-anchored verification | **Missing** | **P1** |
| `/gsd-docs-update` — verified documentation generation (doc-writer + doc-verifier agents) | Exists as `/gtd-update-docs` | Verify parity |

### 2.11 User Profiling & Settings

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-profile-user` — developer behavioral profile for personalized responses | **Missing** | **P2** |
| Model profiles (quality/balanced/budget/inherit) per agent | **Missing** | **P1** |
| `/gsd-set-profile <profile>` — switch model profile | **Missing** | **P1** |
| `workflow.discuss_mode` (discuss vs assumptions) | **Missing** | **P1** |
| `workflow.auto_advance` — auto-chain discuss → plan → execute | **Missing** | **P1** |
| `workflow.use_worktrees` — toggle worktree isolation | **Missing** | **P2** |
| `workflow.text_mode` — text-only mode for remote sessions | **Missing** | **P2** |

### 2.12 Brownfield Intelligence

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `/gsd-map-codebase [area]` — analyze existing codebase with parallel agents (stack, architecture, conventions, concerns) | Exists as `/gtd-scan` | GTD's is more robust (35+ framework fingerprints) |
| `/gsd-ingest-docs [dir]` — scan mixed ADRs/PRDs/SPECs, classify, merge into `.planning/` | **Missing** | **P1** |

### 2.13 Installation & Distribution

| GSD Feature | GTD Status | Priority |
|---|---|---|
| `--minimal` / `--core-only` install (6 skills, ~700 tokens overhead) | **Missing** | **P1** |
| `--uninstall` flag | **Missing** | **P1** |
| `--no-sdk` / `--sdk` flags for SDK management | N/A (different architecture) | — |
| Development installation (`clone → build:hooks → install --local`) | **Missing** | **P2** |
| Agent size-budget enforcement (line-count limits per agent tier) | **Missing** | **P2** |
| Manifest mode tracking (`full` vs `minimal`) | **Missing** | **P2** |

### 2.14 Additional Runtimes

| Runtime | GSD | GTD | Gap |
|---|---|---|---|
| Kilo | Yes | No | **Add** |
| Antigravity | Yes | No | **Add** |
| Trae | Yes | No | **Add** |
| Qwen Code | Yes | No | **Add** |
| CodeBuddy | Yes | No | **Add** |

---

## 3. What BMAD Has That GTD Lacks

### 3.1 Named Persona Agents

BMAD's agents are not generic roles — they are named personas with distinct communication styles:

| BMAD Agent | Persona | GTD Equivalent |
|---|---|---|
| Analyst (Mary) | Business analyst, brainstorming, market research | No equivalent — GTD has researchers but no BA role |
| Product Manager (John) | PRD creation, validation, epic definition | No equivalent — GTD jumps from questioning to requirements |
| Architect (Winston) | System architecture design | No equivalent — GTD's planner + researcher somewhat overlap |
| Developer (Amelia) | Story implementation, code review, sprint planning | GTD's `gtd-executor` + `gtd-code-reviewer` |
| UX Designer (Sally) | UX design creation | **Missing entirely** |
| Technical Writer (Paige) | Documentation, Mermaid diagrams, explain concepts | GTD has writer agents but no interactive "explain concept" |

**Gap:** GTD has 33 focused agents but no **product management**, **business analysis**, **UX design**, or **interactive technical writing** personas.

### 3.2 Agile Ceremony Support

| BMAD Feature | GTD Status | Priority |
|---|---|---|
| Epics and Stories (structured agile artifacts) | **Missing** — GTD uses phases and plans, not epics/stories | **P1** |
| Sprint Planning workflow | **Missing** | **P1** |
| Epic Retrospective | **Missing** | **P2** |
| PRFAQ Challenge (test product concepts) | **Missing** | **P2** |
| Correct Course (mid-project adjustment) | **Missing** | **P1** |

### 3.3 Module / Plugin Ecosystem

| BMAD Feature | GTD Status | Priority |
|---|---|---|
| Module system (install additional modules for specialized domains) | **Missing** | **P1** |
| BMad Builder — create custom agents and workflows | **Missing** | **P1** |
| Test Architect (TEA) module — risk-based test strategy | **Missing** | **P1** |
| Game Dev Studio module (Unity, Unreal, Godot) | **Missing** | **P2** |
| Creative Intelligence Suite (innovation, brainstorming, design thinking) | **Missing** | **P2** |

### 3.4 Party Mode (Multi-Agent Collaboration)

BMAD's "Party Mode" brings multiple agent personas into one session to discuss and debate. GTD has no equivalent — agents are always isolated.

### 3.5 Scale-Domain-Adaptive Intelligence

| Feature | BMAD | GTD |
|---|---|---|
| Adjusts planning depth by project complexity | Yes (core feature) | Partial (`scale-adapter.cjs` exists for 5 tiers) |
| Domain-adaptive (different strategies for web, mobile, game, etc.) | Yes | **Missing** — GTD adapts by size, not domain |

### 3.6 Product Brief & Market Research

BMAD includes pre-development workflows that GTD entirely skips:
- **Create Brief** — structured product brief before PRD
- **Market Research** — domain and competitor research
- **Domain Research** — technical domain deep-dive
- **Technical Research** — technology evaluation
- **PRFAQ** — Amazon-style Press Release / FAQ challenge

GTD's `/gtd-new-project` does questioning + research but lacks these as standalone reusable workflows.

---

## 4. GTD's Unique Strengths (Moat)

These are areas where GTD is **ahead** of both GSD and BMAD:

| GTD Advantage | GSD | BMAD |
|---|---|---|
| **Backward Pipeline** (code → 7 document types) | No equivalent | No equivalent (BMAD has tech writer but no automated backward pipeline) |
| **Sync Mode** (drift detection + reconciliation) | No equivalent | No equivalent |
| **7 document types** (TDD, HLD, LLD, Capacity, System Design, API Docs, Runbook) | None | BMAD has PRD + Architecture only |
| **Accuracy Verifier** (anti-hallucination for generated docs) | None | None |
| **4 document formats** (standard, enterprise, startup, compliance) | None | None |
| **MCP Server** (19 tools, language-agnostic, stdio transport) | GSD SDK CLI only | None |
| **Incremental doc updates** (diff engine, section-level targeting) | None | None |
| **35+ framework fingerprints** across 8 languages | Basic codebase mapping | None |
| **Compliance templates** (SOC 2, ISO 27001, HIPAA) | None | None |

**The backward pipeline + sync mode is GTD's moat.** Neither GSD nor BMAD can generate or maintain technical documentation from code. This is a significant differentiator.

---

## 5. Build Plan: Agents, Commands, and Workflows to Add

### Phase 1 — Critical Gaps (P0)

These are table-stakes features that both competitors offer and GTD lacks.

#### New Agents (6)

| Agent | File | Purpose |
|---|---|---|
| `gtd-session-manager` | `agents/utility/gtd-session-manager.md` | Serialize/restore session state for pause/resume across context windows |
| `gtd-quick-planner` | `agents/forward/gtd-quick-planner.md` | Lightweight planner for ad-hoc tasks (no research, no plan-check by default) |
| `gtd-pr-creator` | `agents/forward/gtd-pr-creator.md` | Create PRs from verified phase work with auto-generated title/body |
| `gtd-fast-executor` | `agents/forward/gtd-fast-executor.md` | Execute trivial tasks inline without planning overhead |
| `gtd-security-enforcer` | `agents/forward/gtd-security-enforcer.md` | Threat-model-anchored security verification for phase output |
| `gtd-doc-ingester` | `agents/backward/gtd-doc-ingester.md` | Classify and merge external ADRs/PRDs/SPECs into `.planning/` |

#### New Commands (8)

| Command | Category | Purpose |
|---|---|---|
| `/gtd-pause` | session | Create HANDOFF.json with current state, decisions, blockers |
| `/gtd-resume` | session | Restore context from HANDOFF.json |
| `/gtd-quick` | forward | Ad-hoc task with GTD guarantees (`--discuss`, `--research`, `--full`, `--validate`) |
| `/gtd-fast` | forward | Inline trivial tasks — skip planning entirely |
| `/gtd-ship` | forward | Create PR from verified phase work (`--draft` for draft PRs) |
| `/gtd-ingest-docs` | backward | Scan external docs directory, classify, merge into `.planning/` |
| `/gtd-session-report` | session | Generate summary of current session's work |
| `/gtd-secure-phase` | forward | Security audit with threat-model verification |

#### New Workflows (6)

| Workflow | Purpose |
|---|---|
| `workflows/session/pause.md` | Serialize full session state to HANDOFF.json |
| `workflows/session/resume.md` | Restore session from HANDOFF.json |
| `workflows/forward/quick.md` | Quick task pipeline (optional discuss → plan → execute → verify) |
| `workflows/forward/fast.md` | Inline execution for trivial tasks |
| `workflows/forward/ship.md` | PR creation from verified phase work |
| `workflows/backward/ingest-docs.md` | External document ingestion |

#### New Lib Modules (3)

| Module | Purpose |
|---|---|
| `lib/session.cjs` | Serialize/deserialize session state (HANDOFF.json) |
| `lib/pr-builder.cjs` | PR title/body generation from phase summaries |
| `lib/ingest.cjs` | Document classification and `.planning/` merge logic |

### Phase 2 — Differentiation Gaps (P1)

Features that make the competition feel more polished and complete.

#### New Agents (5)

| Agent | File | Purpose |
|---|---|---|
| `gtd-spike-runner` | `agents/forward/gtd-spike-runner.md` | Run throwaway experiments (2-5 spikes) with Given/When/Then verdicts |
| `gtd-sketch-designer` | `agents/forward/gtd-sketch-designer.md` | Generate 2-3 interactive HTML mockup variants |
| `gtd-ui-spec-writer` | `agents/forward/gtd-ui-spec-writer.md` | Generate UI-SPEC.md for frontend phases |
| `gtd-ui-reviewer` | `agents/forward/gtd-ui-reviewer.md` | 6-pillar visual audit of implemented frontend code |
| `gtd-forensics-investigator` | `agents/utility/gtd-forensics-investigator.md` | Post-mortem investigation of failed workflow runs |

#### New Commands (15)

| Command | Category | Purpose |
|---|---|---|
| `/gtd-spike` | forward | Run throwaway experiments before committing to a plan |
| `/gtd-sketch` | forward | Generate interactive HTML mockup variants |
| `/gtd-spike-wrap-up` | forward | Package spike findings into a project-local skill |
| `/gtd-sketch-wrap-up` | forward | Package sketch findings into a project-local skill |
| `/gtd-ui-phase` | forward | Generate UI-SPEC.md for frontend phases |
| `/gtd-ui-review` | forward | Visual audit of implemented frontend code |
| `/gtd-stats` | utility | Project statistics dashboard |
| `/gtd-forensics` | utility | Post-mortem investigation of failed runs |
| `/gtd-audit-uat` | forward | Find phases missing user acceptance testing |
| `/gtd-audit-milestone` | forward | Verify milestone achieved its definition of done |
| `/gtd-milestone-summary` | forward | Comprehensive project summary for onboarding/review |
| `/gtd-plant-seed` | backlog | Capture forward-looking ideas with trigger conditions |
| `/gtd-add-backlog` | backlog | Parking lot for ideas outside active sequence |
| `/gtd-review-backlog` | backlog | Promote backlog items or remove stale entries |
| `/gtd-thread` | session | Persistent context threads for cross-session work |

#### New Workflows (10)

| Workflow | Purpose |
|---|---|
| `workflows/forward/spike.md` | Spiking pipeline |
| `workflows/forward/sketch.md` | Sketching pipeline |
| `workflows/forward/ui-phase.md` | UI spec generation |
| `workflows/forward/ui-review.md` | UI visual audit |
| `workflows/forward/audit-uat.md` | UAT coverage check |
| `workflows/forward/audit-milestone.md` | Milestone definition-of-done verification |
| `workflows/forward/milestone-summary.md` | Milestone summary generation |
| `workflows/utility/stats.md` | Project statistics |
| `workflows/utility/forensics.md` | Post-mortem investigation |
| `workflows/session/thread.md` | Persistent context threads |

#### New Infrastructure

| Item | Purpose |
|---|---|
| Model profiles in config.json | Support quality/balanced/budget/inherit per agent role |
| `--minimal` install flag | Ship only core 6 commands (~700 tokens overhead) |
| `--uninstall` flag | Clean removal of GTD from any runtime |
| `--chain` and `--batch` flags on discuss | Faster intake during discussion |
| Git branching strategies | `none` / `phase` / `milestone` with configurable templates |
| `threads/`, `seeds/`, `todos/` directories | New `.planning/` subdirectories for lightweight state |
| Workstreams support | Parallel namespaced milestone work |

#### New Runtimes (5)

| Runtime | Install Flag | Path |
|---|---|---|
| Kilo | `--kilo` | `~/.config/kilo/` |
| Antigravity | `--antigravity` | `~/.gemini/antigravity/` |
| Trae | `--trae` | `~/.trae/` |
| Qwen Code | `--qwen` | `~/.qwen/` |
| CodeBuddy | `--codebuddy` | `~/.codebuddy/` |

### Phase 3 — Aspirational (P2)

Features that would push GTD beyond both competitors.

| Feature | Purpose |
|---|---|
| BMAD-style named personas (optional "personality mode") | More engaging interaction for solo devs |
| Party Mode (multi-agent discussion in one session) | Debate trade-offs before committing |
| Module/plugin ecosystem | Let community extend GTD with domain-specific modules |
| Epic/Story mapping (in addition to phase/plan) | Agile teams compatibility |
| Sprint planning workflow | Enterprise team workflow |
| Interactive technical writer ("explain this concept") | Lower barrier for new developers |
| Domain-adaptive intelligence (not just size-adaptive) | Different strategies for web, mobile, game, data, ML |
| GSD 2-style VS Code extension (sidebar, SCM provider, checkpoints) | IDE-native experience beyond slash commands |

---

## 6. Recommended Roadmap

```
Milestone 1: Session & Quick Mode (P0)
├── /gtd-pause, /gtd-resume, /gtd-session-report
├── /gtd-quick (--discuss, --research, --full, --validate)
├── /gtd-fast
├── /gtd-ship
├── /gtd-ingest-docs
├── /gtd-secure-phase
├── Model profiles (quality/balanced/budget/inherit)
└── --uninstall flag

Milestone 2: Experimentation & Observability (P1)
├── /gtd-spike, /gtd-sketch, /gtd-spike-wrap-up, /gtd-sketch-wrap-up
├── /gtd-ui-phase, /gtd-ui-review
├── /gtd-stats, /gtd-forensics
├── /gtd-audit-uat, /gtd-audit-milestone, /gtd-milestone-summary
├── Backlog system: /gtd-plant-seed, /gtd-add-backlog, /gtd-review-backlog
├── /gtd-thread (persistent context threads)
├── Workstreams (parallel namespaced milestone work)
├── Git branching strategies
├── --minimal install
├── --chain and --batch flags
└── 5 new runtimes (Kilo, Antigravity, Trae, Qwen Code, CodeBuddy)

Milestone 3: Beyond Parity (P2)
├── Module/plugin ecosystem
├── Named personas (optional)
├── Party Mode (multi-agent session)
├── Epic/Story mapping
├── Sprint planning
├── Domain-adaptive intelligence
└── VS Code extension
```

---

## 7. Summary

### Numbers Comparison

| Metric | GTD (Current) | GSD | BMAD | GTD (After M1+M2) |
|---|---|---|---|---|
| Commands | 40 | 60+ | 34+ | **63** |
| Agents | 33 | 33 | 6 personas | **44** |
| Workflows | 29 | ~60 | 34+ | **45** |
| Hooks | 4 | ~6 | — | 4 |
| Runtimes | 9 | 15 | Tool-agnostic | **14** |
| Document Types | **7** | 0 | 2 (PRD, Architecture) | **7** |
| MCP Tools | **19** | 0 | 0 | **19+** |
| Sync Mode | **Yes** | No | No | **Yes** |

### Strategic Position

GTD's **backward pipeline** (code → docs) and **sync mode** (drift detection + reconciliation) are genuinely unique. No competitor has this. The MCP server is another strong differentiator.

The gaps are primarily in the **forward pipeline's developer experience**: session management, quick/fast modes, spiking/sketching, PR workflow, backlog, and observability. These are "quality of life" features that make the difference between a framework you use once and one you use every day.

**The recommendation:** Close the P0 gaps first (Milestone 1 — session, quick, fast, ship) to make GTD viable for daily use. Then add P1 (Milestone 2 — experimentation, observability, backlog) to match GSD's polish. The backward pipeline + sync mode + MCP server keep GTD differentiated throughout.
