<purpose>
Present a generated document draft to the user for review. Collect feedback, apply revisions if needed, and finalize when approved.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init review-document "$DOC_TYPE" "$ARGUMENTS")
```
Parse: docs_root, doc_type from args.

Locate the document:
1. Check drafts/<TYPE>-DRAFT.md → present draft for review
2. Check documents/<TYPE>.md → present finalized doc for re-review
3. Error if neither exists: "No document found for {doc_type}. Generate one with /gtd-create-{type}."
</step>

<step name="load_verification">
Check if a verification report exists:
- `.planning/verification/<TYPE>-VERIFICATION.md`
- `.planning/verification/<TYPE>-COMPLETENESS.md`

If both exist, load them and summarize:
- Accuracy confidence score
- Inaccurate claims count
- Completeness score
- Gaps found

If no verification report: note "Unverified — run /gtd-verify-docs {type} for accuracy check."
</step>

<step name="present_document">
Display to user:

```
📄 Reviewing: {Doc Type} ({draft|finalized} v{version})

{#if has_verification}
  Verification: {accuracy_score}% accurate ({verified}/{total} claims verified)
  Completeness: {completeness_score}%
  {#if inaccurate > 0}
  ⚠ {inaccurate} inaccurate claims flagged
  {/if}
  {#if gaps > 0}
  📝 {gaps} documentation gaps found
  {/if}
{/if}

The document is at: {doc_path}
Please review it and provide your feedback.

Options:
  - "approved" or "looks good" → Finalize
  - Specific feedback → I'll revise the affected sections
  - "cancel" → Keep as draft, exit
```
</step>

<step name="handle_feedback">
If user says "approved" / "looks good" / "finalize" / "lgtm":
  → Go to finalize step

If user provides specific feedback:
  1. Identify which sections need revision
  2. Read the current draft
  3. Apply the requested changes directly
  4. Write updated draft
  5. Re-present with changes highlighted
  6. Ask for approval again

If user says "cancel":
  → "Draft preserved at {draft_path}. Resume with /gtd-review-docs {type}."
  → EXIT
</step>

<step name="finalize">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" doc finalize "$DOC_TYPE"
```

Display:
```
✓ {Doc Type} v{version} finalized!

  Saved to: .planning/documents/{FILENAME}.md

  Next steps:
  - /gtd-create-<type> to generate another document
  - /gtd-create-all to generate remaining documents
  - /gtd-verify-docs {type} to run accuracy check
  - /gtd-status for pipeline overview
```
</step>

</process>

<error_handling>
- Document not found → suggest appropriate /gtd-create-* command
- Revision fails → preserve original draft, report error
- State update fails → warn but don't block finalization
</error_handling>
