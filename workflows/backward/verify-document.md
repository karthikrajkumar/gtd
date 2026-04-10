<purpose>
Run accuracy verification and completeness audit on a generated document.
Spawns both verification agents and produces a combined report.
</purpose>

<available_agent_types>
- gtd-accuracy-verifier — Cross-references claims against codebase
- gtd-completeness-auditor — Checks template and component coverage
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init verify-document "$DOC_TYPE" "$ARGUMENTS")
```
Parse: project_root, docs_root, config, state, args.
Extract: doc_type from args, --strict flag.

Locate the document to verify:
1. Check drafts/<TYPE>-DRAFT.md (verify draft before finalization)
2. Check documents/<TYPE>.md (verify finalized document)
3. Error if neither exists
</step>

<step name="spawn_verifiers">
**Spawn accuracy verifier:**
```
Verify the document at: {doc_path}
Project root: {project_root}
Codebase map: {docs_root}/CODEBASE-MAP.md
Write report to: {docs_root}/verification/{DOC_FILENAME}-VERIFICATION.md
```

**Spawn completeness auditor:**
```
Audit completeness of: {doc_path}
Codebase map: {docs_root}/CODEBASE-MAP.md
Analysis directory: {docs_root}/analysis/
Template type: {doc_type}
Write report to: {docs_root}/verification/{DOC_FILENAME}-COMPLETENESS.md
```

Run both agents (sequentially or in parallel per config).
</step>

<step name="aggregate_results">
Read both reports. Produce combined summary:

```
📋 Verification Results: {Doc Type}

  Accuracy:
    ✓ Verified: {N} claims
    ✗ Inaccurate: {N} claims
    ? Unverifiable: {N} claims
    Confidence: {score}%

  Completeness:
    Sections: {complete}/{total}
    Components: {documented}/{total}
    Overall: {score}%

  {#if inaccurate > 0}
  ⚠ Corrections needed:
    {list of inaccuracies with corrections}
  {/if}

  {#if gaps > 0}
  📝 Documentation gaps:
    {list of missing components/sections}
  {/if}
```

If --strict and (accuracy < 90% or completeness < 100%):
  Display: "STRICT MODE: Verification failed. Fix issues before finalizing."
</step>

</process>
