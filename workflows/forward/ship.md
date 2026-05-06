<purpose>
Create a pull request from verified phase work. Generates meaningful PR content from
execution artifacts and handles branch management.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-pr-creator — Generate PR title/body and create the PR
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init ship "$ARGUMENTS")
```
Parse: phase_number, docs_root, config, state, git, args.
Extract --draft flag.

If no phase_number specified, use current phase from STATE.md.
</step>

<step name="preflight_checks">
Verify:
1. Phase exists and has been executed (SUMMARY files present)
2. Git working tree is clean (no uncommitted changes)
3. We're not on main/master (warn if so — suggest creating a branch)

If verification exists (VERIFICATION.md), note status.
If no verification: warn but allow (user chose to skip).

```
  ℹ Shipping Phase {N}: {name}
    Commits: {count} since phase start
    Verification: {✓ passed | ⚠ not run}
```
</step>

<step name="handle_branch">
Based on config.git.branching_strategy:

**"none" (default):**
  Ship from current branch. No branch manipulation.

**"phase":**
  If not already on a phase branch:
    Create branch: `gsd/phase-{N}-{slug}`
    Cherry-pick or rebase phase commits onto it.

**"milestone":**
  If not already on a milestone branch:
    Create branch: `gsd/{milestone}-{slug}`
</step>

<step name="push">
Push current branch to origin:
```bash
git push -u origin HEAD
```

If push fails (no remote, auth issue): report error and output the manual command.
</step>

<step name="create_pr">
Generate PR content:
```bash
TITLE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" pr title "$PHASE_NUMBER")
BODY=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" pr body "$PHASE_NUMBER")
```

If `gh` CLI available:
```bash
gh pr create --title "$TITLE" --body "$BODY" ${DRAFT_FLAG}
```

If `gh` not available:
```
  ℹ GitHub CLI (gh) not found. Create PR manually:

    Title: {title}
    Body: (saved to .planning/phases/{N}/PR-BODY.md)
    
    Or install gh: https://cli.github.com/
```
</step>

<step name="report">
Display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ PR created {--draft: "(draft)"}                        │
│                                                            │
│  Title        {title}                                      │
│  Branch       {branch_name}                                │
│  URL          {pr_url}                                     │
│  Status       {draft|ready for review}                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-next              advance to next phase
    → /gtd-new-milestone     if all phases complete
```
</step>

</process>

<error_handling>
- No SUMMARY files → Error: "Phase {N} not executed. Run /gtd-execute-phase {N} first."
- Working tree dirty → Error: "Uncommitted changes. Commit or stash first."
- Push fails → Report error, suggest checking remote/auth
- gh CLI fails → Save PR body to file, show manual instructions
</error_handling>
