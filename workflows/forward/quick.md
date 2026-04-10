<purpose>
Quick one-off task without full planning ceremony. Takes a task description, creates a minimal plan, executes it, verifies, and commits. No research, no discussion, no milestone tracking. For small fixes and additions.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init quick "$ARGUMENTS")
```
Parse: docs_root, config, task_description from arguments.
If no task description provided → error: "Usage: /gtd-quick <task description>"
</step>

<step name="minimal_plan">
Create an inline plan (not written to disk) from the task description:
- Identify affected files from the task description
- Break into 1-3 concrete steps
- No dependency analysis, no wave grouping

Display:
```
Quick task: {description}
  Steps:
    1. {step}
    2. {step}
    ...
```
</step>

<step name="execute">
Execute each step sequentially:
- Make the code changes
- Run relevant tests if they exist
- Fix any immediate failures

Commit after completion:
```bash
git add -A && git commit -m "quick: {short_description}"
```
</step>

<step name="verify">
Lightweight verification:
- Do changed files parse/compile without errors?
- Do existing tests still pass?
- Does the change match the task description?

Display:
```
Done: {description}

  Files changed: {count}
  Tests: {pass|fail|none}
  Commit: {short_sha}
```
</step>

</process>

<error_handling>
- Task too complex (>5 files affected) → suggest using /gtd-plan-phase instead
- Test failures → attempt one fix cycle, then report failure
- Ambiguous task → ask user for clarification before proceeding
</error_handling>
