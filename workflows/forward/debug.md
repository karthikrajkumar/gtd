<purpose>
Diagnose and fix issues. Spawns a gtd-debugger agent with error context. Accepts error output, stack trace, or "last command failed" as input. Agent reads code, identifies root cause, applies fix, and verifies.
</purpose>

<available_agent_types>
- gtd-debugger — Diagnoses failures, reads code, applies fixes
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init debug "$ARGUMENTS")
```
Parse: docs_root, config, state, error_context from arguments.
Accept input as: raw error text, --file path/to/error.log, or --last (re-read last command output).
</step>

<step name="gather_context">
Collect debugging context:
- Error message or stack trace from input
- Current phase and recent changes (git log --oneline -10)
- Relevant source files mentioned in the error
- Test output if available

If --last flag: retrieve the most recent command output from shell history or logs.
</step>

<step name="spawn_debugger">
Spawn gtd-debugger agent:
```
Diagnose and fix this issue:

Error context:
{error_output}

Recent changes:
{git_log}

Relevant files:
{file_list}

Project docs:
  PROJECT.md: {path}
  REQUIREMENTS.md: {path}

Steps:
1. Identify root cause
2. Apply minimal fix
3. Verify fix resolves the error
4. Commit with message: "fix: {short description}"
```
</step>

<step name="report">
Display:
```
Debug complete

  Root cause: {description}
  Fix applied: {files_changed}
  Commit: {short_sha}
  Verification: {pass|fail}

  Next: /gtd-next (continue pipeline)
        /gtd-debug (if issue persists)
```

If fix failed after 3 attempts: report unresolved, suggest manual intervention.
</step>

</process>

<error_handling>
- No error context provided → prompt user: "Paste the error or use --last"
- Debugger cannot identify cause → report findings, suggest files to inspect manually
- Fix introduces new failures → revert fix, report both original and new errors
</error_handling>
