<purpose>
Create a PR or push code after phase execution and verification.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init ship "$ARGUMENTS")
```
Parse: config.execution.branching_strategy, git context, phase info.
</step>

<step name="create_pr">
If --pr flag or branching_strategy is "phase-branch":
  ```bash
  git push -u origin HEAD
  ```
  
  Create PR with structured description:
  - Title: "Phase {N}: {Phase Name}"
  - Body: requirements addressed, tasks completed, test results
  - Link to VERIFICATION.md results

Display PR URL.
</step>

<step name="direct_push">
If branching_strategy is "trunk":
  ```bash
  git push origin main
  ```
</step>

<step name="update_state">
Mark phase as shipped in ROADMAP.md.
Suggest next: /gtd-next or /gtd-complete-milestone.
</step>

</process>
