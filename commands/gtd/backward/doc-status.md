---
name: gtd-doc-status
description: "Show status of all generated documents — which exist, versions, staleness."
tools:
  - Read
  - Bash
---

# /gtd-doc-status

Show document pipeline status.

## Usage
```
/gtd-doc-status
```

## Process

```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" doc list
```

Display formatted table of all 7 document types with status.
