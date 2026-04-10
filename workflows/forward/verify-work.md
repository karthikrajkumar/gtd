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
Display:
```
Phase {N} Verification Results:

  Requirements: {passed}/{total} met ✓
  Tests: {pass_count} passed, {fail_count} failed
  Regression: {clean|issues_found}
  
  {#if has_review}
  Code Review: {critical} critical, {major} major, {minor} minor
  {/if}

  {#if all_pass}
  ✓ Phase {N} verified — ready for /gtd-deploy-local or /gtd-ship
  {/if}
  {#if has_failures}
  ⚠ {failure_count} issues need attention. Use /gtd-debug to investigate.
  {/if}
```
</step>

</process>
