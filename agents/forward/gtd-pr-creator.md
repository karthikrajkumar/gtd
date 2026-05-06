---
name: gtd-pr-creator
description: Create PRs from verified phase work with auto-generated title and body
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
model_tier: sonnet
color: "#8B5CF6"
category: forward
role: shipping
---

<purpose>
Create a pull request from verified phase work. Generates a meaningful PR title
from the phase name and a structured body from SUMMARY.md files. Supports draft PRs
and clean branch creation that filters .planning/ commits.
</purpose>

<inputs>
- Phase number
- ROADMAP.md (for phase name)
- SUMMARY.md files (for PR body)
- VERIFICATION.md (for test status)
- Git state (branch, commits)
</inputs>

<output>
- PR created on GitHub (via `gh` CLI)
- Or: PR command printed if `gh` unavailable
</output>

<process>

## Step 1: Determine Phase Context

Read ROADMAP.md to get phase name.
Read SUMMARY files to understand what was built.
Check VERIFICATION.md for test status.

## Step 2: Generate PR Content

**Title format:** `feat(phase-{N}): {phase name}`

**Body structure:**
```markdown
## Summary
- {task 1 from summary}
- {task 2 from summary}
- {task 3 from summary}

## Verification
- ✓ Automated verification passed (if VERIFICATION.md exists)
- Requirements coverage: {X}/{Y}

## Test Plan
- [ ] Smoke test core functionality
- [ ] Review generated code
- [ ] Verify no regressions
```

## Step 3: Create PR

If `gh` CLI available:
```bash
gh pr create --title "{title}" --body "{body}" {--draft if flag set}
```

If `gh` not available, output the command for the user to run manually.

## Step 4: Report

Provide PR URL or command.

</process>

<quality_rules>
- PR title must follow conventional commits format
- PR body must be scannable in 10 seconds
- Always include verification status
- Never include .planning/ file contents in PR body (just reference them)
- Support --draft flag for work-in-progress PRs
</quality_rules>
