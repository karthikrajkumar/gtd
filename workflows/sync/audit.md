<purpose>
Run a full alignment audit across specifications, code, and documentation. Produces a comprehensive coverage matrix and gap analysis showing what is implemented, documented, and tested — and what is missing.
</purpose>

<available_agent_types>
- gtd-alignment-auditor — Full alignment audit with coverage matrix
</available_agent_types>

<process>

<step name="initialize" priority="first">
Load context:

```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init audit "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse JSON for: `project_root`, `docs_root`, `config`, `state`, `git`, `args`.

Parse `--compliance` flag: `soc2` | `iso27001` | none (default: none).
Parse `--force` flag to re-run even if recent audit exists.
</step>

<step name="check_existing_audit">
If `.planning/AUDIT-REPORT.md` exists AND is less than 24 hours old AND `--force` is not set:
  Display:
  ```
  Recent audit report found (generated: {timestamp}).
  Use --force to re-run.
  ```
  Present the existing report summary and EXIT.
</step>

<step name="spawn_alignment_auditor">
Spawn `gtd-alignment-auditor` agent with prompt:

```
Run a full alignment audit on the project at: {project_root}

Compliance checks: {args.compliance or "none"}

Docs root: {docs_root}
Git context:
  commit: {git.commit}
  branch: {git.branch}

Follow the process defined in your agent definition.
Write the audit report to: {docs_root}/AUDIT-REPORT.md
```

Wait for agent completion. Verify AUDIT-REPORT.md exists.
</step>

<step name="update_state">
Read the generated AUDIT-REPORT.md frontmatter to get coverage metrics.

```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.last_audit "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.spec_coverage "{spec_coverage}"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.doc_coverage "{doc_coverage}"
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update sync.test_coverage "{test_coverage}"
```
</step>

<step name="display_report">
Present the coverage matrix and gap summary:

```
Alignment Audit Complete

  Coverage:
    Spec coverage:  {spec}%  {status_emoji}
    Doc coverage:   {doc}%   {status_emoji}
    Test coverage:  {test}%  {status_emoji}
    Full coverage:  {full}%  {status_emoji}
    Orphan code:    {orphan}%

  Gaps found:
    Undocumented code:    {count}
    Unimplemented specs:  {count}
    Untested features:    {count}
    Orphan documentation: {count}

  Full report: {docs_root}/AUDIT-REPORT.md
```

If compliance checks were run:
```
  Compliance ({type}):
    Pass:   {pass_count}
    Fail:   {fail_count}
    Partial: {partial_count}
```

Suggest next steps based on gaps:
- If spec coverage < 80%: "Run /gtd-reconcile --strategy spec-wins to plan implementation"
- If doc coverage < 80%: "Run /gtd-create-all to regenerate documentation"
- If test coverage < 60%: "Consider adding tests for untested features"
</step>

</process>

<error_handling>
- If alignment auditor agent fails: report error, suggest checking if codebase has been scanned
- If AUDIT-REPORT.md is not produced: report failure, check agent output for errors
- If no specs exist: run audit with code-and-docs only, note missing specs in report
- If no docs exist: run audit with code-and-specs only, note missing docs in report
- If compliance flag is unrecognized: warn and proceed without compliance checks
</error_handling>
