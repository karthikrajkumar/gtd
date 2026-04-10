---
name: gtd-help
description: "Show available GTD commands and contextual guidance. Use when the user asks for help or what to do next."
tools:
  - Read
  - Bash
---

# /gtd-help

Get Things Done — Bidirectional spec-driven agentic framework.

## Available Commands

### Backward Pipeline (Code → Documents)
| Command | Description |
|---------|-------------|
| `/gtd-scan` | Scan and map the codebase |
| `/gtd-analyze` | Deep code analysis (6 dimensions) |
| `/gtd-create-tdd` | Generate Technical Design Document |
| `/gtd-create-hld` | Generate High-Level Design |
| `/gtd-create-lld` | Generate Low-Level Design |
| `/gtd-create-capacity` | Generate Capacity Plan |
| `/gtd-create-sysdesign` | Generate System Design |
| `/gtd-create-api-docs` | Generate API Documentation |
| `/gtd-create-runbook` | Generate Operations Runbook |
| `/gtd-create-all` | Generate full document suite |
| `/gtd-verify-docs` | Verify document accuracy |
| `/gtd-update-docs` | Incremental document update |

### Forward Pipeline (Idea → Code → Deploy)
| Command | Description |
|---------|-------------|
| `/gtd-new-project` | Initialize from idea |
| `/gtd-plan-phase N` | Research + plan phase |
| `/gtd-execute-phase N` | Generate code |
| `/gtd-deploy-local` | Deploy locally |
| `/gtd-test-phase N` | Run tests |
| `/gtd-ship` | Create PR |

### Sync (Bidirectional)
| Command | Description |
|---------|-------------|
| `/gtd-drift` | Detect spec ↔ code drift |
| `/gtd-sync` | Auto-reconcile |

### Utility
| Command | Description |
|---------|-------------|
| `/gtd-status` | Pipeline status dashboard |
| `/gtd-settings` | Configuration |
| `/gtd-help` | This help |

## What to do next

Check the pipeline state:
```bash
node gtd-tools.cjs state pipeline
```

Based on the state, recommend the appropriate next command.
