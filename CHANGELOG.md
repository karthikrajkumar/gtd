# Changelog

All notable changes to Get Things Done (GTD) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.13.0] - 2026-05-06

### Changed

- `/gtd-new-project` workflow rewritten to be conversational and engaging — phased questioning (dream → why → user → vibe → constraints), assumptions mode for brownfield, confirmation gate before research, research highlights presented interactively, roadmap as narrative
- `references/questioning.md` overhauled — collaborator tone instead of intake-form style, adaptive depth per response pattern, assumptions-first mode for existing codebases

### Added

- `docs/COMPETITIVE-ANALYSIS.md` — deep comparative study vs GSD (58.7k stars) and BMAD (46k stars), full gap analysis, and build plan for 23 new commands, 11 new agents, and 16 new workflows across 3 milestones
- GitHub Copilot setup script error message now mentions `--copilot --local` (previously only said `--cursor --local`)

## [1.12.0] - 2026-04-12

### Added

- Documentation for GitHub Copilot: local install plus `setup-copilot-prompts.sh` from the repo ([raw script URL](https://raw.githubusercontent.com/karthikrajkumar/gtd/main/scripts/setup-copilot-prompts.sh)) so Copilot Chat can load `/gtd-*` prompts from `.github/prompts/`.

## [1.0.0] - 2026-04-10

### Added

**Backward Pipeline (Code to Documents)**
- Codebase scanner with 35+ framework fingerprints across 8 languages
- 7 analyzer agents: architecture, API, patterns, data flow, dependencies, security, performance
- 7 document writer agents: TDD, HLD, LLD, Capacity, System Design, API Docs, Runbook
- Accuracy verifier and completeness auditor (anti-hallucination)
- 4 document format variants: standard, enterprise, startup, compliance
- Incremental document updates via diff engine

**Forward Pipeline (Idea to Deploy)**
- Project initialization with adaptive questioning and parallel research
- Phase discussion system for preference capture
- Planner with plan-checker revision loop (up to 3 iterations)
- Wave-based parallel code execution
- Local deployment with auto-detect (Docker, npm, Python, Go, Rust)
- Test runner with 6 framework support (Vitest, Jest, pytest, Go, Cargo, RSpec)
- Verification, code review, and debug agents

**Sync Mode (Drift Detection)**
- Drift detector: ADDITION, REMOVAL, MUTATION, STRUCTURAL categories
- Reconciliation planner: code-wins, spec-wins, interactive strategies
- Alignment auditor: full coverage matrix (requirements to code to docs to tests)

**Infrastructure**
- Multi-runtime installer: Claude Code, OpenCode, Gemini, Codex, Copilot, Cursor, Windsurf, Augment, Cline
- TypeScript SDK for CI/CD integration
- 20 error codes with recovery instructions
- Secret scanner (12 patterns), prompt injection guard (5 patterns)
- 4 runtime hooks: statusline, context monitor, prompt guard, update checker
- Scale-adaptive intelligence: 5 project tiers (micro to enterprise)
- SOC 2 and ISO 27001 compliance template pack

### Stats
- 33 agents (12 forward + 18 backward + 3 sync)
- 40 commands (16 forward + 15 backward + 4 sync + 5 utility)
- 29 workflows (18 forward + 7 backward + 4 sync)
- 21 templates, 11 references, 6 context profiles, 4 hooks
- 21 lib modules, 1,030+ tests
