# Git Branching Strategies

> Configuration reference for GTD's git branch management.

---

## Overview

GTD supports three branching strategies, configured in `.planning/config.json`:

```json
{
  "git": {
    "branching_strategy": "phase"
  }
}
```

---

## Strategy: `none` (default)

All work happens on the current branch. No branch creation or management.

**Best for:** Solo developers, small projects, trunk-based development.

```
main ─── commit ─── commit ─── commit ─── commit
```

---

## Strategy: `phase`

Each phase gets its own branch. PRs merge phases into the main branch.

**Best for:** Teams, projects with code review requirements.

```
main ─────────────────────────────────── merge ─── merge
  \                                      /          /
   \─ gtd/phase-1-auth ─── commit ─── PR          /
    \                                             /
     \─── gtd/phase-2-crud ─── commit ─── commit ─── PR
```

**Branch naming:** `gtd/phase-{N}-{slug}`

**Behavior:**
- `/gtd-execute-phase N` creates branch if not exists
- `/gtd-ship N` pushes and creates PR targeting main
- After merge, next phase branches from updated main

---

## Strategy: `milestone`

One branch per milestone (group of phases). Larger PRs, less merge overhead.

**Best for:** Projects where phases are tightly coupled within a milestone.

```
main ────────────────────────────── merge
  \                                 /
   \─ gtd/m1-mvp ─── P1 ─── P2 ─── P3 ─── PR
```

**Branch naming:** `gtd/{milestone-slug}`

**Behavior:**
- First phase in milestone creates the branch
- All phases commit to the same branch
- `/gtd-ship` or `/gtd-complete-milestone` creates the PR

---

## Configuration

```json
{
  "git": {
    "branching_strategy": "phase",
    "main_branch": "main",
    "branch_prefix": "gtd/",
    "auto_push": false,
    "clean_planning_commits": true
  }
}
```

| Setting | Description | Default |
|---------|-------------|---------|
| `branching_strategy` | `none`, `phase`, `milestone` | `none` |
| `main_branch` | Target branch for PRs | `main` |
| `branch_prefix` | Prefix for auto-created branches | `gtd/` |
| `auto_push` | Push after each phase execution | `false` |
| `clean_planning_commits` | Squash `.planning/` commits on ship | `true` |

---

## Commands Affected

| Command | `none` | `phase` | `milestone` |
|---------|--------|---------|-------------|
| `/gtd-execute-phase` | Commits to current branch | Creates/switches to phase branch | Creates/switches to milestone branch |
| `/gtd-ship` | Pushes current branch, creates PR | Pushes phase branch, creates PR → main | Pushes milestone branch, creates PR → main |
| `/gtd-complete-milestone` | No branch action | Verifies all phase PRs merged | Creates PR for milestone branch |
