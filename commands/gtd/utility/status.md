---
name: gtd-status
description: "Show full pipeline status dashboard — forward progress, backward documents, sync alignment, analysis cache, metrics."
tools:
  - Read
  - Bash
---

# /gtd-status

Show the GTD pipeline status dashboard.

## Usage
```
/gtd-status
```

## Process

1. Load state:
```bash
STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state get)
ANALYSIS=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" analysis status)
DOCS=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" doc list)
```

2. Display formatted dashboard:

```
╔═══════════════════════════════════════════════╗
║           GTD Pipeline Status                 ║
╠═══════════════════════════════════════════════╣
║ Project: {project name}                       ║
║ Mode: {bidirectional|forward|backward}        ║
╠═══════════════════════════════════════════════╣
║ Forward Pipeline:  {status}                   ║
║   Phase: {N} of {total}                       ║
║   Milestone: {name}                           ║
╠═══════════════════════════════════════════════╣
║ Backward Pipeline: {status}                   ║
║   Last Scan: {commit} ({date})                ║
║   Analysis: {current}/{total} dimensions      ║
╠═══════════════════════════════════════════════╣
║ Documents:                                    ║
║   ✓ TDD    v1.0  (current)                   ║
║   ✓ HLD    v1.0  (current)                   ║
║   ⚠ LLD    v1.0  (stale)                    ║
║   - Capacity      (not generated)             ║
║   ...                                         ║
╠═══════════════════════════════════════════════╣
║ Sync: {synced|drifted} ({N} drift items)      ║
╠═══════════════════════════════════════════════╣
║ Cost: ${total} ({tokens} tokens)              ║
╚═══════════════════════════════════════════════╝
```

3. Suggest next action based on state.
