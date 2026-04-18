# Get Things Done (GTD) — User Guide

> Complete guide for installing and using GTD with your AI coding tool.
> Includes detailed Cursor setup walkthrough.

---

## Table of Contents

- [Quick Start (Any Runtime)](#quick-start-any-runtime)
- [Detailed Installation](#detailed-installation)
  - [Installing in Cursor (Step-by-Step)](#installing-in-cursor-step-by-step)
  - [Installing in Claude Code](#installing-in-claude-code)
  - [Installing in GitHub Copilot](#installing-in-github-copilot)
  - [Installing in Other Runtimes](#installing-in-other-runtimes)
- [Your First Backward Pipeline (Code to Docs)](#your-first-backward-pipeline-code-to-docs)
- [Your First Forward Pipeline (Idea to Code)](#your-first-forward-pipeline-idea-to-code)
- [Using Sync Mode](#using-sync-mode)
- [Command Reference](#command-reference)
- [Configuration](#configuration)
- [Document Formats](#document-formats)
- [Workflows Explained](#workflows-explained)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Quick Start (Any Runtime)

```bash
# Install
npx get-things-done@latest

# Follow prompts to select your runtime and location
# Then open your AI coding tool and run:

/gtd-help
```

That's it. GTD is installed. Read on for detailed setup and usage.

---

## Detailed Installation

### System Requirements

- **Node.js 20+** — Check with `node --version`
- **Git** — Check with `git --version`
- **An AI coding tool** — Claude Code, Cursor, Gemini CLI, Copilot, etc.

### Interactive Install

```bash
npx get-things-done@latest
```

You'll see:

```
  Get Things Done v1.0.0
  Forward. Backward. In Sync.

  Select runtime(s):

    1. Claude Code
    2. OpenCode
    3. Gemini CLI
    4. Codex
    5. Copilot
    6. Cursor
    7. Windsurf
    8. Augment
    9. Cline
    10. All

  Enter numbers (comma-separated): 
```

Then choose location:

```
  Location:
    1. Global (all projects)
    2. Local (current project only)

  Enter 1 or 2: 
```

### Non-Interactive Install

For CI, Docker, or scripted setups:

```bash
# Cursor, global install
npx get-things-done --cursor --global

# Claude Code, local install
npx get-things-done --claude --local

# Multiple runtimes
npx get-things-done --cursor --claude --global

# All runtimes, local
npx get-things-done --all --local
```

---

## Installing in Cursor (Step-by-Step)

### Step 1: Install GTD

Open your terminal (not inside Cursor — a regular terminal):

```bash
npx get-things-done --cursor --global
```

Expected output:

```
  Get Things Done v1.0.0
  Forward. Backward. In Sync.

  Installing for Cursor...
    Path: /Users/you/.cursor/get-things-done/
    ✓ Done (150+ files)

  ✓ GTD v1.0.0 installed for 1 runtime(s)
```

### Step 2: Verify Installation

Check the files were created:

```bash
ls ~/.cursor/get-things-done/
# Should show: agents/ bin/ commands/ contexts/ hooks/ references/ templates/ workflows/

ls ~/.cursor/get-things-done/agents/backward/ | head -5
# Should show agent .md files
```

### Step 3: Open Your Project in Cursor

Open any existing project in Cursor:

```bash
cd /path/to/your/project
cursor .
```

### Step 4: Start Using GTD

In Cursor's AI chat (Cmd+L or the chat panel), type:

```
/gtd-help
```

If Cursor recognizes the command, you'll see the GTD help menu with all 40 commands.

> **Note:** Cursor loads commands from `~/.cursor/get-things-done/commands/`. If `/gtd-help` doesn't work, you may need to:
> 1. Restart Cursor
> 2. Check that Cursor's agent/rules are configured to load from `~/.cursor/`
> 3. Try a local install instead: `npx get-things-done --cursor --local` (run this inside your project directory)

### Step 5: Scan Your Codebase (Backward Pipeline)

```
/gtd-scan
```

This maps your entire codebase:
- Detects languages and frameworks
- Identifies entry points
- Maps module boundaries
- Finds infrastructure (Docker, CI/CD, databases)

Output: `.planning/CODEBASE-MAP.md`

### Step 6: Generate Your First Document

```
/gtd-create-tdd
```

This will:
1. Auto-run analysis (if not done yet)
2. Generate a Technical Design Document
3. Verify accuracy against your actual code
4. Present the draft for your review
5. Finalize on your approval

Output: `.planning/documents/TDD.md`

### Step 7: Generate All Documents

```
/gtd-create-all
```

Generates all 7 document types in one run:
- Technical Design Document (TDD)
- High-Level Design (HLD)
- Low-Level Design (LLD)
- Capacity Plan
- System Design
- API Documentation
- Operations Runbook

### Alternative: Local Install for Cursor

If the global install doesn't work with Cursor, try local:

```bash
cd /path/to/your/project
npx get-things-done --cursor --local
```

This installs GTD in `./.cursor/get-things-done/` within your project directory.

---

## Installing in Claude Code

```bash
npx get-things-done --claude --global
```

Claude Code 2.1.88+ uses the **skills** format. GTD commands install as:
- `~/.claude/skills/gtd-scan/SKILL.md`
- `~/.claude/skills/gtd-create-tdd/SKILL.md`
- etc.

Claude Code auto-discovers skills. Just type `/gtd-help` in any project.

---

## Installing in GitHub Copilot

GTD’s Copilot installer writes command markdown under `.github/get-things-done/commands/gtd/`. Copilot Chat expects **prompt files** under `.github/prompts/*.prompt.md`. The npm package does not bundle the helper that links the two, so copy it from the Git repository and run it once per project after `--copilot --local`.

**Script:**

- Browse: [scripts/setup-copilot-prompts.sh](https://github.com/karthikrajkumar/gtd/blob/main/scripts/setup-copilot-prompts.sh)
- Raw (for `curl` or “Save As”): `https://raw.githubusercontent.com/karthikrajkumar/gtd/main/scripts/setup-copilot-prompts.sh`

```bash
cd /path/to/your/project
npx get-things-done@latest --copilot --local
mkdir -p scripts
curl -fsSL https://raw.githubusercontent.com/karthikrajkumar/gtd/main/scripts/setup-copilot-prompts.sh -o scripts/setup-copilot-prompts.sh
bash scripts/setup-copilot-prompts.sh
```

Then enable prompt files for `.github/prompts` in VS Code settings, run **Developer: Reload Window**, and use `/gtd-help` (or `/gtd-` prefix) in Copilot Chat.

---

## Installing in Other Runtimes

| Runtime | Install Command | Verify Command |
|---------|----------------|----------------|
| **Claude Code** | `npx get-things-done --claude --global` | `/gtd-help` |
| **OpenCode** | `npx get-things-done --opencode --global` | `/gtd-help` |
| **Gemini CLI** | `npx get-things-done --gemini --global` | `/gtd-help` |
| **Codex** | `npx get-things-done --codex --global` | `$gtd-help` |
| **Copilot** | `npx get-things-done --copilot --global` | `/gtd-help` |
| **Cursor** | `npx get-things-done --cursor --global` | `/gtd-help` |
| **Windsurf** | `npx get-things-done --windsurf --global` | `/gtd-help` |
| **Augment** | `npx get-things-done --augment --global` | `/gtd-help` |
| **Cline** | `npx get-things-done --cline --local` | Check `.clinerules` |

### Global vs Local

| Location | When to Use | Install Path |
|----------|-------------|-------------|
| **Global** | GTD available in ALL projects | `~/.<runtime>/get-things-done/` |
| **Local** | GTD only in THIS project | `./<runtime>/get-things-done/` |

**Recommendation:** Start with global. Switch to local only if you need project-specific GTD config.

---

## Your First Backward Pipeline (Code to Docs)

The backward pipeline generates technical documents from your existing codebase.

### Step 1: Scan

```
/gtd-scan
```

Output:
```
✓ Codebase scanned successfully

  Project: my-project
  Files indexed: 234
  Languages: TypeScript (72%), Python (18%), SQL (10%)
  Frameworks: Next.js 14, FastAPI
  Entry points: apps/web/src/app/layout.tsx, apps/api/main.py
  Infrastructure: Docker, GitHub Actions, Prisma

  Run /gtd-create-* to generate documents.
```

### Step 2: Generate a Specific Document

```
/gtd-create-tdd
```

This runs the full pipeline:
1. **Analysis** — 7 analyzer agents examine your code (architecture, API, patterns, data flow, dependencies, security, performance)
2. **Writing** — TDD writer agent produces a structured document from analysis
3. **Verification** — Accuracy verifier cross-checks every claim against actual code
4. **Review** — Draft presented to you with verification score

You'll see something like:

```
📄 TDD draft generated

  Sections: 10
  Verification: 95% claims verified (38/40)
  
  ⚠ 2 claims flagged — review sections: Dependencies, API Design

  Options:
  - "approved" → Finalize document
  - Provide feedback → Revise and re-present
  - "cancel" → Save draft, exit
```

Type `approved` to finalize, or give feedback like "update the dependency versions" to revise.

### Step 3: Generate All Documents

```
/gtd-create-all
```

Generates all 7 documents in wave-based order:
- Wave 1: TDD, HLD, API Docs (parallel)
- Wave 2: LLD, System Design, Capacity Plan
- Wave 3: Runbook

### Step 4: Verify Documents

```
/gtd-verify-docs tdd
```

Runs accuracy and completeness checks on a finalized document.

### Step 5: Check Status

```
/gtd-status
```

Shows the full pipeline dashboard.

---

## Your First Forward Pipeline (Idea to Code)

The forward pipeline builds software from an idea.

### Step 1: Initialize Project

```
/gtd-new-project
```

GTD asks you questions to understand your idea:
- What are you building?
- Who is it for?
- Technical preferences?
- Constraints?

Then it:
1. Spawns 4 parallel research agents
2. Extracts requirements (v1 must-have, v2 future, out of scope)
3. Creates a phased roadmap

### Step 2: Discuss Phase Preferences

```
/gtd-discuss-phase 1
```

Before building, GTD identifies gray areas and asks for your preferences:
- Auth mechanism? (JWT vs sessions)
- Password hashing? (bcrypt vs argon2)
- API response format?

### Step 3: Plan the Phase

```
/gtd-plan-phase 1
```

Researches implementation approaches and creates a detailed execution plan with:
- Task list with dependencies
- Wave grouping (independent tasks in parallel)
- Verification commands per task

### Step 4: Execute

```
/gtd-execute-phase 1
```

The executor agent writes code, runs tests, and commits atomically per task.

### Step 5: Deploy Locally

```
/gtd-deploy-local
```

Auto-detects deployment method (Docker, npm start, Python, etc.), builds, starts, and health-checks.

### Step 6: Run Tests

```
/gtd-test-phase 1
```

Discovers your test framework and runs the suite.

### Step 7: Ship

```
/gtd-ship --pr
```

Creates a PR with structured description linking to requirements and verification results.

### Shortcut: Autonomous Mode

```
/gtd-autonomous 1 --to 5
```

Runs phases 1 through 5 unattended — discuss, plan, execute, verify for each phase automatically.

---

## Using Sync Mode

After building code (forward) and generating docs (backward), keep them in sync.

### Detect Drift

```
/gtd-drift
```

Output:
```
Found 3 drift items:
  MAJOR:      New /api/admin endpoint not in spec
  MINOR:      Auth uses session instead of JWT (spec says JWT)
  INFO:       Added rate limiting (improvement beyond spec)
```

### Auto-Reconcile

```
/gtd-sync --auto
```

Updates specs and docs to match the current code (code-wins strategy).

### Interactive Reconcile

```
/gtd-reconcile --strategy interactive
```

Presents each drift item and lets you choose: update spec, update code, or acknowledge.

### Full Audit

```
/gtd-audit
```

Produces a coverage matrix:
```
  Requirements → Code:  94%
  Requirements → Docs:  87%
  Requirements → Tests: 72%
  Overall:              84%

  Gaps: 3
  - /api/admin endpoint undocumented
  - REQ-AUTH-03 has no tests
  - Capacity plan doesn't cover new caching layer
```

---

## Command Reference

### Backward Commands (Code → Documents)

| Command | What It Does |
|---------|-------------|
| `/gtd-scan` | Scan and map codebase structure |
| `/gtd-analyze` | Deep code analysis (7 dimensions) |
| `/gtd-create-tdd` | Generate Technical Design Document |
| `/gtd-create-hld` | Generate High-Level Design |
| `/gtd-create-lld` | Generate Low-Level Design |
| `/gtd-create-capacity` | Generate Capacity Plan |
| `/gtd-create-sysdesign` | Generate System Design |
| `/gtd-create-api-docs` | Generate API Documentation |
| `/gtd-create-runbook` | Generate Operations Runbook |
| `/gtd-create-all` | Generate all 7 documents |
| `/gtd-verify-docs [type]` | Verify document accuracy |
| `/gtd-review-docs [type]` | Review with feedback loop |
| `/gtd-update-docs` | Incremental update (changed sections only) |
| `/gtd-diff` | Show code changes and doc impact |
| `/gtd-doc-status` | Document pipeline status |

### Forward Commands (Idea → Code)

| Command | What It Does |
|---------|-------------|
| `/gtd-new-project` | Initialize from idea |
| `/gtd-discuss-phase N` | Lock in preferences for phase |
| `/gtd-plan-phase N` | Research + create plan |
| `/gtd-execute-phase N` | Generate code |
| `/gtd-verify-work N` | Verify execution |
| `/gtd-deploy-local` | Deploy locally |
| `/gtd-test-phase N` | Run tests |
| `/gtd-ship` | Create PR |
| `/gtd-next` | Auto-advance to next step |
| `/gtd-autonomous N [--to M]` | Run phases unattended |
| `/gtd-quick <task>` | Quick one-off task |
| `/gtd-fast <task>` | Fast mode (skip research) |
| `/gtd-debug` | Diagnose and fix issues |
| `/gtd-code-review` | Code quality review |
| `/gtd-progress` | Forward pipeline dashboard |
| `/gtd-add-phase <desc>` | Add phase to roadmap |

### Sync Commands (Bidirectional)

| Command | What It Does |
|---------|-------------|
| `/gtd-drift` | Detect spec ↔ code drift |
| `/gtd-reconcile` | Plan how to fix drift |
| `/gtd-sync` | Auto-reconcile (detect + fix) |
| `/gtd-audit` | Full alignment audit |

### Utility Commands

| Command | What It Does |
|---------|-------------|
| `/gtd-help` | Show all commands with guidance |
| `/gtd-status` | Full pipeline dashboard |
| `/gtd-settings` | View/modify configuration |
| `/gtd-health` | Check installation health |
| `/gtd-map-codebase` | Alias for /gtd-scan |

---

## Configuration

### View Settings

```
/gtd-settings
```

### Change a Setting

```
/gtd-settings documents.format enterprise
/gtd-settings models.analyzer opus
/gtd-settings workflow.parallelization false
```

### Key Settings

| Setting | Default | Options |
|---------|---------|---------|
| `documents.format` | `standard` | `standard`, `enterprise`, `startup`, `compliance` |
| `models.analyzer` | `sonnet` | `sonnet`, `opus`, `haiku` |
| `models.writer` | `sonnet` | `sonnet`, `opus`, `haiku` |
| `models.verifier` | `haiku` | `sonnet`, `opus`, `haiku` |
| `scan.max_files` | `10000` | Any positive number |
| `analysis.depth` | `standard` | `shallow`, `standard`, `deep` |
| `workflow.require_verification` | `true` | `true`, `false` |
| `workflow.parallelization` | `true` | `true`, `false` |
| `planning.granularity` | `standard` | `coarse` (3-5), `standard` (5-8), `fine` (8-12) |
| `sync.auto_sync` | `false` | `true`, `false` |

---

## Document Formats

Use `--format` with any `/gtd-create-*` command:

```
/gtd-create-tdd --format enterprise
/gtd-create-all --format compliance
```

| Format | Sections | Best For |
|--------|----------|----------|
| **standard** | 10 | Most engineering teams |
| **enterprise** | 15 | Architecture review boards, large orgs |
| **startup** | 7 | Small teams, rapid iteration, MVPs |
| **compliance** | 18 | SOC 2, ISO 27001, HIPAA audits |

---

## Workflows Explained

### How GTD Works Internally

```
You type: /gtd-create-tdd

1. COMMAND (commands/gtd/backward/create-tdd.md)
   → Loads the generate-document workflow

2. WORKFLOW (workflows/backward/generate-document.md)
   → Checks prerequisites (scan? analysis?)
   → Spawns analyzer agents if needed
   → Spawns TDD writer agent
   → Spawns accuracy verifier
   → Presents draft for review

3. AGENTS (agents/backward/gtd-tdd-writer.md)
   → Fresh context window (no rot)
   → Reads analysis artifacts
   → Loads template
   → Generates document
   → Writes to .planning/drafts/TDD-DRAFT.md

4. STATE (.planning/STATE.md)
   → Updated at each step
   → Survives session resets
   → Tracks both forward and backward pipelines
```

### The .planning/ Directory

All GTD state lives here:

```
.planning/
├── STATE.md              # Pipeline status (forward + backward + sync)
├── config.json           # Your settings
├── CODEBASE-MAP.md       # Codebase structure map
├── REQUIREMENTS.md       # Requirements (forward pipeline)
├── ROADMAP.md            # Phase roadmap (forward pipeline)
├── PROJECT.md            # Project vision (forward pipeline)
├── DRIFT-REPORT.md       # Drift analysis (sync)
├── analysis/             # Analysis cache (7 dimensions)
├── documents/            # Generated documents (final)
├── drafts/               # Work-in-progress drafts
├── verification/         # Accuracy reports
├── phases/               # Phase plans and summaries (forward)
├── research/             # Research artifacts (forward)
└── history/              # Document version history
```

This directory is:
- **Human-readable** — All Markdown and JSON
- **Git-committable** — Add to version control for team visibility
- **Session-persistent** — Survives `/clear` and restarts

---

## Troubleshooting

### "Command not found" when typing /gtd-help

1. **Restart your AI tool** — Some runtimes need a restart to discover new commands
2. **Check install path** — Run `ls ~/.cursor/get-things-done/commands/` (adjust for your runtime)
3. **Try local install** — `npx get-things-done --cursor --local` from your project directory
4. **Check runtime version** — Some older runtime versions don't support custom commands

### Documents seem inaccurate

1. Run `/gtd-verify-docs <type>` to get a verification report
2. If score is below 90%, run `/gtd-analyze --force` to refresh analysis
3. Then regenerate: `/gtd-create-<type>`

### "No codebase map found"

Run `/gtd-scan` first. This is required before any document generation.

### Pipeline seems stuck

Check state: `/gtd-status`

If state is corrupted, delete `.planning/STATE.md` and start fresh:
```bash
rm .planning/STATE.md
```

### Documents are too detailed / not detailed enough

Change the format:
```
/gtd-settings documents.format startup    # Less detail
/gtd-settings documents.format enterprise # More detail
```

Or change analysis depth:
```
/gtd-settings analysis.depth shallow    # Faster, less detail
/gtd-settings analysis.depth deep       # Slower, more detail
```

---

## FAQ

### Can I use GTD with an existing codebase?

**Yes!** That's the backward pipeline's primary use case. Run `/gtd-scan` then `/gtd-create-all`.

### Can I use both forward and backward at the same time?

**Yes!** GTD tracks both pipelines independently. Build with forward, document with backward, keep in sync with `/gtd-sync`.

### Does GTD modify my source code?

**Backward pipeline:** No. It only reads code and writes to `.planning/`.
**Forward pipeline:** Yes — the executor agent writes code and commits.
**Sync pipeline:** Only if you choose spec-wins strategy (creates fix tasks).

### How much does it cost (API tokens)?

Approximate costs per document (Claude Sonnet pricing):
- Single document: $1-5 depending on project size
- Full 7-doc suite: $5-20
- Incremental update: $0.50-3

### Can I customize the document templates?

Yes! Templates are Markdown files in `templates/backward/`. Copy a template, modify it, and use `--format your-name`.

### Is my code sent to an API?

GTD runs through your AI coding tool (Claude Code, Cursor, etc.). Your code is processed by whatever LLM your tool uses. GTD itself doesn't make any API calls — it's a prompt framework, not a service.

### Can I use GTD in CI/CD?

Yes! Use the SDK:
```bash
npm install get-things-done-sdk
```
See `sdk/examples/` for GitHub Actions and GitLab CI templates.

---

*End of User Guide*
