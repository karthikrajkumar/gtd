---
name: gtd-health
description: "Run a health check on the GTD installation — verify all components are present and functional."
tools:
  - Read
  - Bash
  - Glob
---

# /gtd-health

Verify GTD installation is healthy.

## Usage
```
/gtd-health
```

## Process

Check the following:

1. **Framework files present:**
   - bin/gtd-tools.cjs exists and runs
   - agents/backward/ has 18 agent files
   - workflows/backward/ has 6 workflow files
   - references/ has 6 reference files
   - templates/backward/ has 7 document type directories

2. **Node.js version:**
   - Must be >= 20.0.0

3. **Git available:**
   - `git --version` succeeds
   - Current directory is in a git repo

4. **State consistency:**
   - If .planning/ exists, STATE.md should be parseable
   - config.json should be valid JSON

5. Display results:

```
GTD Health Check
─────────────────
✓ Framework files: 18 agents, 6 workflows, 6 references
✓ Node.js: v{version}
✓ Git: available (branch: {branch})
✓ State: consistent
✓ Config: valid

Overall: HEALTHY
```
