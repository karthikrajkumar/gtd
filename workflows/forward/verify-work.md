<purpose>
Verify that executed phase output meets requirements. Runs tests, checks requirements traceability, and detects cross-phase regression.
</purpose>

<available_agent_types>
- gtd-verifier — Requirements verification and regression check
- gtd-code-reviewer — Code quality review (optional)
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init verify-work "$ARGUMENTS")
```
Parse: phase_number, docs_root, plans, summaries.
</step>

<step name="spawn_verifier">
Spawn gtd-verifier with phase context, SUMMARY files, and REQUIREMENTS.md.
Agent produces VERIFICATION.md.
</step>

<step name="optional_code_review">
If config.workflow.require_review:
  Spawn gtd-code-reviewer.
  Agent produces REVIEW.md.
</step>

<step name="present_results">
Display (per references/output-style.md):

If all pass:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Phase {N} verified                                     │
│                                                            │
│  Requirements  {passed}/{total} met                        │
│  Tests         {pass_count} passing, {fail_count} failing  │
│  Regression    clean                                       │
│  {#if has_review}                                          │
│  Code Review   {critical}C {major}M {minor}m               │
│  {/if}                                                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-deploy-local   test locally
    → /gtd-ship {N}       create PR
```

If failures:
```
  ✗ Phase {N} verification: {failure_count} issues

    {REQ-ID}   {description} — {failure reason}
    {REQ-ID}   {description} — {failure reason}

  Next:
    → /gtd-debug   auto-diagnose and fix
```
</step>

</process>
