<purpose>
Code quality review. Spawns a gtd-code-reviewer agent on the current phase's changes. Produces REVIEW.md with findings categorized as critical, major, minor, or suggestion.
</purpose>

<available_agent_types>
- gtd-code-reviewer — Reviews code for quality, correctness, and style
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init code-review "$ARGUMENTS")
```
Parse: phase_number (optional, defaults to current phase), docs_root, config, state.
Determine diff scope: phase branch vs main, or staged changes.
</step>

<step name="collect_changes">
Gather the changeset for review:
```bash
DIFF=$(git diff main...HEAD --stat)
FILES=$(git diff main...HEAD --name-only)
```

If no phase specified, review all uncommitted + committed changes since last milestone.
Read project conventions from PROJECT.md if available.
</step>

<step name="spawn_reviewer">
Spawn gtd-code-reviewer agent:
```
Review these changes for code quality:

Changed files:
{file_list}

Project context:
  PROJECT.md: {path}
  REQUIREMENTS.md: {path}

Review criteria:
- Correctness: bugs, logic errors, edge cases
- Security: vulnerabilities, input validation
- Performance: inefficiencies, N+1 queries
- Maintainability: readability, naming, complexity
- Style: consistency with project conventions

Categorize each finding as: critical / major / minor / suggestion
Write: {phase_dir}/REVIEW.md
```
</step>

<step name="display">
Display summary:
```
Code Review — Phase {N}

  Files reviewed: {count}
  Critical: {count}
  Major:    {count}
  Minor:    {count}
  Suggestions: {count}

  Full report: {phase_dir}/REVIEW.md

  Next: /gtd-debug (fix critical issues)
        /gtd-next (continue if clean)
```
</step>

</process>

<error_handling>
- No changes to review → inform user: "No changes found. Nothing to review."
- Phase not found → review current working tree changes instead
- Reviewer timeout → produce partial review from completed files
</error_handling>
