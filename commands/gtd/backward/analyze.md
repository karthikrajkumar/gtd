---
name: gtd-analyze
description: "Run deep code analysis across 6 dimensions (architecture, API, patterns, data flow, dependencies, security, performance). Spawns parallel analyzer agents."
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
---

# /gtd-analyze

Perform deep code analysis on the codebase.

## Usage
```
/gtd-analyze [--focus <dimension>] [--force]
```

## Flags
- `--focus <dimension>` — Analyze only one dimension (architecture, api, data-flow, dependencies, security, performance)
- `--force` — Re-analyze all dimensions even if current

## Dimensions
| Dimension | Agent | Output |
|-----------|-------|--------|
| architecture | gtd-architecture-analyzer | ARCHITECTURE-ANALYSIS.md |
| api | gtd-api-extractor | API-SURFACE.md |
| patterns | gtd-pattern-detector | PATTERN-ANALYSIS.md |
| data-flow | gtd-data-flow-tracer | DATA-FLOW.md |
| dependencies | gtd-dependency-analyzer | DEPENDENCY-GRAPH.md |
| security | gtd-security-scanner | SECURITY-SURFACE.md |
| performance | gtd-performance-profiler | PERFORMANCE-ANALYSIS.md |

## Process

Load and follow the workflow at:
@workflows/backward/analyze-codebase.md

Pass `$ARGUMENTS` to the workflow for flag parsing.
