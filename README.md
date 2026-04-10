<div align="center">

# GET THINGS DONE

**The first bidirectional spec-driven agentic framework for AI-assisted development.**

**Forward.** Idea to code to deploy.
**Backward.** Code to technical documents.
**In Sync.** Detect drift. Reconcile. Stay aligned.

[![npm version](https://img.shields.io/npm/v/get-things-done?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/get-things-done)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-1030%20passing-brightgreen?style=for-the-badge)](tests/)

<br>

```bash
npx get-things-done@latest
```

**Works with Claude Code, Gemini CLI, OpenCode, Codex, Copilot, Cursor, Windsurf, Augment, and Cline.**

</div>

---

## Why Get Things Done?

Other tools go one direction. GSD and BMAD generate code from specs. Auto-doc tools generate docs from code. **Nobody does both, and nobody keeps them in sync.**

GTD is different. One framework. One `.planning/` directory. Both directions.

```
FORWARD >>>     Idea -> Research -> Spec -> Plan -> Code -> Deploy -> Test
BACKWARD <<<    Code -> Scan -> Analyze -> Draft -> Verify -> Finalize
SYNC <><>       Detect Drift -> Reconcile -> Stay Aligned
```

---

## Quick Start

```bash
npx get-things-done@latest
```

The installer prompts you to choose:
1. **Runtime** — Claude Code, Gemini CLI, OpenCode, Codex, Copilot, Cursor, Windsurf, Augment, Cline
2. **Location** — Global (all projects) or local (current project only)

Then start using it:

```bash
# BACKWARD: Document existing code
/gtd-scan                    # Map your codebase
/gtd-create-tdd              # Generate Technical Design Document
/gtd-create-all              # Generate all 7 document types

# FORWARD: Build from an idea
/gtd-new-project             # Initialize from an idea
/gtd-plan-phase 1            # Research + create plan
/gtd-execute-phase 1         # Generate code
/gtd-deploy-local            # Deploy and test locally

# SYNC: Keep everything aligned
/gtd-drift                   # Detect spec <-> code drift
/gtd-sync                    # Auto-reconcile
```

---

## Three Modes

### Backward Mode: Code to Documents

Already have code? Generate professional technical documentation in minutes.

| Command | Generates |
|---------|-----------|
| `/gtd-create-tdd` | Technical Design Document |
| `/gtd-create-hld` | High-Level Design |
| `/gtd-create-lld` | Low-Level Design |
| `/gtd-create-capacity` | Capacity Plan |
| `/gtd-create-sysdesign` | System Design |
| `/gtd-create-api-docs` | API Documentation |
| `/gtd-create-runbook` | Operations Runbook |
| `/gtd-create-all` | All 7 documents |

Every document is **accuracy-verified** against your actual code before you see it. No hallucination.

### Forward Mode: Idea to Deploy

Describe what you want. GTD builds it.

```
/gtd-new-project → Questions → Research → Requirements → Roadmap
/gtd-plan-phase N → Research → Detailed execution plan
/gtd-execute-phase N → Parallel code generation with atomic commits
/gtd-deploy-local → Build → Start → Health check
/gtd-test-phase N → Run tests → Coverage report
/gtd-ship → Create PR
```

### Sync Mode: Drift Detection

After building, specs and code drift apart. GTD catches it.

```
/gtd-drift     → "Found 3 drift items: 1 new endpoint, 1 changed behavior, 1 config change"
/gtd-sync      → Auto-update specs and docs to match code
/gtd-audit     → Full coverage matrix: requirements → code → docs → tests
```

---

## What Makes GTD Different

| Feature | GSD | BMAD | GTD |
|---------|-----|------|-----|
| Forward (spec to code) | Yes | Yes | **Yes** |
| Backward (code to docs) | No | No | **Yes** |
| Bidirectional sync | No | No | **Yes** |
| Document accuracy verification | No | No | **Yes** |
| Local deploy + test | No | No | **Yes** |
| Drift detection | No | No | **Yes** |
| 9+ runtime support | Yes | Limited | **Yes** |

---

## Architecture

GTD uses **33 specialized agents** orchestrated by thin workflows:

- **12 Forward Agents:** Researchers, planner, executor, deployer, test-runner, debugger
- **18 Backward Agents:** Codebase mapper, 7 analyzers, 7 writers, diagram generator, 2 verifiers
- **3 Sync Agents:** Drift detector, reconciliation planner, alignment auditor

Each agent spawns with a **fresh context window** — no context rot.

```
User -> Command -> Workflow -> Agent(s) -> File Artifacts -> State Update
```

All state lives in `.planning/` as human-readable Markdown. Git-committable. Inspectable.

---

## Document Formats

| Format | Sections | Audience |
|--------|----------|----------|
| `standard` | 10 | Engineering teams |
| `enterprise` | 15 | Architecture review boards |
| `startup` | 7 | Small teams, rapid iteration |
| `compliance` | 18 | SOC 2, ISO 27001, HIPAA auditors |

```bash
/gtd-create-tdd --format compliance
```

---

## Scale-Adaptive

GTD automatically adjusts based on project size:

| Tier | Files | Behavior |
|------|-------|----------|
| Micro | 1-5 | Single combined document |
| Small | 5-50 | Standard 7-document set |
| Medium | 50-500 | Full suite with cross-references |
| Large | 500-5K | Domain-decomposed documents |
| Enterprise | 5K+ | Service-level docs + integration maps |

---

## Non-Interactive Install

```bash
# Claude Code, global
npx get-things-done --claude --global

# All runtimes, local
npx get-things-done --all --local

# Specific runtimes
npx get-things-done --gemini --copilot --global
```

---

## SDK for CI/CD

```bash
npm install get-things-done-sdk
```

```typescript
import { GTD } from 'get-things-done-sdk';

const gtd = new GTD({ projectDir: '.', autoMode: true });
const staleness = await gtd.checkStaleness();

if (staleness.staleDocuments.length > 0) {
  await gtd.updateAll();
}
```

---

## Commands Reference

### Backward (15 commands)
`/gtd-scan` `/gtd-analyze` `/gtd-create-tdd` `/gtd-create-hld` `/gtd-create-lld` `/gtd-create-capacity` `/gtd-create-sysdesign` `/gtd-create-api-docs` `/gtd-create-runbook` `/gtd-create-all` `/gtd-verify-docs` `/gtd-review-docs` `/gtd-update-docs` `/gtd-diff` `/gtd-doc-status`

### Forward (16 commands)
`/gtd-new-project` `/gtd-discuss-phase` `/gtd-plan-phase` `/gtd-execute-phase` `/gtd-verify-work` `/gtd-deploy-local` `/gtd-test-phase` `/gtd-ship` `/gtd-next` `/gtd-autonomous` `/gtd-quick` `/gtd-fast` `/gtd-debug` `/gtd-code-review` `/gtd-add-phase` `/gtd-progress`

### Sync (4 commands)
`/gtd-drift` `/gtd-reconcile` `/gtd-sync` `/gtd-audit`

### Utility (5 commands)
`/gtd-help` `/gtd-status` `/gtd-settings` `/gtd-health` `/gtd-map-codebase`

---

## License

MIT License. See [LICENSE](LICENSE).

---

<div align="center">

**Get Things Done.** Forward. Backward. In Sync.

</div>
