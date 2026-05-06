---
name: gtd-help
description: "Show available GTD commands and contextual guidance. Use when the user asks for help or what to do next."
tools:
  - Read
  - Bash
---

# /gtd-help

Get Things Done — Bidirectional spec-driven agentic framework.

## Required Reading
@references/output-style.md

## Display

Render this using the Help & Command Lists format from output-style.md:

```
╭─ GTD Commands ────────────────────────────────────────────╮
│                                                            │
│  FORWARD >>>  (idea → code → deploy)                      │
│                                                            │
│    /gtd-new-project       initialize from idea             │
│    /gtd-discuss-phase N   shape implementation decisions   │
│    /gtd-plan-phase N      research + create plan           │
│    /gtd-execute-phase N   generate code                    │
│    /gtd-verify-work N     confirm it works                 │
│    /gtd-ship N            create PR                        │
│    /gtd-deploy-local      deploy and test locally          │
│    /gtd-quick             ad-hoc task (no ceremony)        │
│    /gtd-fast              trivial inline task              │
│                                                            │
│  BACKWARD <<<  (code → documents)                         │
│                                                            │
│    /gtd-scan              map codebase                     │
│    /gtd-analyze           deep code analysis               │
│    /gtd-create-tdd        Technical Design Document        │
│    /gtd-create-hld        High-Level Design                │
│    /gtd-create-lld        Low-Level Design                 │
│    /gtd-create-sysdesign  System Design                    │
│    /gtd-create-api-docs   API Documentation                │
│    /gtd-create-runbook    Operations Runbook               │
│    /gtd-create-capacity   Capacity Plan                    │
│    /gtd-create-all        all 7 documents                  │
│    /gtd-verify-docs       check accuracy                   │
│    /gtd-update-docs       incremental update               │
│                                                            │
│  SYNC <><>  (keep aligned)                                │
│                                                            │
│    /gtd-drift             detect spec ↔ code drift         │
│    /gtd-sync              auto-reconcile                   │
│    /gtd-audit             full alignment audit             │
│                                                            │
│  SESSION                                                   │
│                                                            │
│    /gtd-pause             save session state               │
│    /gtd-resume            restore session                  │
│    /gtd-session-report    summarize this session           │
│                                                            │
│  UTILITY                                                   │
│                                                            │
│    /gtd-status            pipeline dashboard               │
│    /gtd-scan              security scan                    │
│    /gtd-ingest            import external docs             │
│    /gtd-settings          configuration                    │
│    /gtd-health            check installation               │
│    /gtd-help              this menu                        │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

## What to do next

Check the pipeline state:
```bash
STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state pipeline)
```

Based on the state, recommend the appropriate next command using the `→` arrow format:

```
  Based on your project state:
    → {command}   {why this is the right next step}
```
