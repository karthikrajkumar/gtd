<purpose>
Update existing documents based on code changes since last generation.
Only re-analyzes and re-writes affected sections — not the full document.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init incremental-update "$ARGUMENTS")
```
Parse: --since commit (default: last generation commit), --doc type (specific doc or all).
</step>

<step name="detect_changes">
Get changed files since the reference commit:
```bash
CHANGED=$(git diff --name-only "$SINCE_COMMIT"..HEAD)
```

Generate impact report:
```bash
IMPACT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" diff-engine impact $CHANGED)
```

Parse: affected dimensions, affected documents with section lists.

If no changes affect any documents:
  Display: "No document-impacting changes since {commit}."
  EXIT
</step>

<step name="targeted_analysis">
For each affected analysis dimension:
  - Check if analysis cache is stale
  - If stale: re-run that specific analyzer agent
  - Merge new findings with existing analysis
  - Update analysis artifact with new commit hash
</step>

<step name="section_patching">
For each affected document (or specific --doc if provided):
  1. Read current finalized document
  2. Archive current version to history/
  3. For each affected section:
     - Spawn writer agent with NARROW prompt:
       "Update ONLY section '{section}'. Current content: {current}. New analysis: {updated}."
     - Replace section in document
  4. Bump version (minor increment)
  5. Re-verify only patched sections
</step>

<step name="present">
Display diff summary:
```
Documents updated:
  TDD: 3 sections revised (architecture, api-design, dependencies)
  HLD: 1 section revised (subsystems)
  
  Verification: {score}% on updated sections
  
  Review with /gtd-review-docs or approve these changes.
```
</step>

<step name="update_state">
Update document versions in STATE.md.
Update last generation commit.
</step>

</process>
