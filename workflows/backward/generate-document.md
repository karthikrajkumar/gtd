<purpose>
Generate a specific document type through the full pipeline: check analysis → run analyzers if stale → draft document → verify accuracy → present for review.

This is the core backward workflow — handles all 7 document types.
</purpose>

<required_reading>
@references/document-standards.md
@references/diagram-conventions.md
</required_reading>

<available_agent_types>
Writers:
- gtd-tdd-writer — Technical Design Document
- gtd-hld-writer — High-Level Design
- gtd-lld-writer — Low-Level Design
- gtd-capacity-writer — Capacity Plan
- gtd-sysdesign-writer — System Design
- gtd-api-doc-writer — API Documentation
- gtd-runbook-writer — Operations Runbook

Support:
- gtd-accuracy-verifier — Cross-reference claims against code
- gtd-completeness-auditor — Check template coverage
- gtd-diagram-generator — Generate Mermaid diagrams
- gtd-codebase-mapper — Scan codebase (if needed)
- gtd-architecture-analyzer (+ other analyzers) — Analysis (if stale)
</available_agent_types>

<doc_type_to_writer>
| Doc Type | Writer Agent | Required Analysis Dimensions |
|----------|-------------|------------------------------|
| tdd | gtd-tdd-writer | architecture, dependencies, data-flow |
| hld | gtd-hld-writer | architecture, data-flow, dependencies |
| lld | gtd-lld-writer | architecture, data-flow, api |
| capacity | gtd-capacity-writer | dependencies, performance, architecture |
| system-design | gtd-sysdesign-writer | ALL dimensions |
| api-docs | gtd-api-doc-writer | api |
| runbook | gtd-runbook-writer | architecture, security, dependencies |
</doc_type_to_writer>

<process>

<step name="initialize" priority="first">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init generate-document "$DOC_TYPE" "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse: `project_root`, `docs_root`, `config`, `state`, `git`, `codebase_map`, `analysis_status`, `documents`, `args`.

Extract: `doc_type` from args (positional or from command name), `format` from args or config, `auto_mode` from --auto flag.
</step>

<step name="check_prerequisites">
**Codebase map required:**
If `codebase_map.exists` is false:
  Display: "No codebase map found. Running /gtd-scan first..."
  Execute scan-codebase workflow
  Re-load context after scan

**Analysis required:**
```bash
STALE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" analysis stale-for "$DOC_TYPE")
```

If stale dimensions exist for this doc type:
  Display: "Analysis needed for: {stale dimensions}. Running analysis..."
  Execute analyze-codebase workflow with --focus on needed dimensions
  Re-load context after analysis
</step>

<step name="check_existing_document">
If a finalized document of this type already exists:
  - Archive current version to history/
  - Display: "Existing {doc_type} v{version} archived. Generating new version..."
  - Bump version number
</step>

<step name="spawn_writer">
Determine writer agent from doc_type_to_writer table above.

Spawn writer agent with prompt:
```
Generate a {doc_type} document for the project at: {project_root}

Format: {format} (standard|enterprise|startup|compliance)

Analysis artifacts available at: {docs_root}/analysis/
  - ARCHITECTURE-ANALYSIS.md: {exists? yes/no}
  - API-SURFACE.md: {exists? yes/no}
  - PATTERN-ANALYSIS.md: {exists? yes/no}
  - DATA-FLOW.md: {exists? yes/no}
  - DEPENDENCY-GRAPH.md: {exists? yes/no}
  - SECURITY-SURFACE.md: {exists? yes/no}
  - PERFORMANCE-ANALYSIS.md: {exists? yes/no}

Codebase map: {docs_root}/CODEBASE-MAP.md
Template: templates/backward/{doc_type}/{format}.md
Output: {docs_root}/drafts/{DOC_FILENAME}-DRAFT.md

Git commit: {git.commit}
GTD version: {gtd_version}

Follow your agent definition process. Write the draft to the output path.
```

Wait for agent completion. Verify draft file was created.
</step>

<step name="verify_accuracy" if="config.workflow.require_verification">
Spawn gtd-accuracy-verifier with:
```
Verify the draft document at: {docs_root}/drafts/{DOC_FILENAME}-DRAFT.md

Cross-reference all claims against the actual codebase at: {project_root}
Write verification report to: {docs_root}/verification/{DOC_FILENAME}-VERIFICATION.md
```

Read verification report. Extract: verified count, inaccurate count, confidence score.
</step>

<step name="present_for_review" if="!auto_mode">
Display to user (per references/output-style.md):

```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ◐ {Doc Type} draft ready for review                      │
│                                                            │
│  Sections      {count}                                     │
│  Word count    ~{estimate}                                 │
│  Verification  {score}% claims verified ({verified}/{total})│
│  {#if inaccurate > 0}                                      │
│  ⚠ Flagged     {inaccurate} claims in: {flagged_sections} │
│  {/if}                                                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Options:
    → "approved"     finalize document
    → feedback       revise and re-present
    → "cancel"       save draft, exit
```

Wait for user response.

If feedback provided:
  - Apply revisions to draft
  - Re-verify if substantial changes
  - Re-present

If "approved":
  - Proceed to finalize
</step>

<step name="finalize">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" doc finalize "$DOC_TYPE"
```

Update STATE.md:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update backward.status finalized
```

Display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ {Doc Type} v{version} finalized                        │
│                                                            │
│  Location      {docs_root}/documents/{DOC_FILENAME}.md     │
│  Verification  {score}% verified                           │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Next:
    → /gtd-create-{next_type}   generate next document
    → /gtd-create-all           generate remaining documents
    → /gtd-verify-docs          run accuracy check
```
</step>

</process>

<error_handling>
- Writer agent timeout → retry once with reduced context
- Writer produces empty output → report error, suggest running /gtd-analyze --force
- Verification score below 70% → warn user prominently, suggest /gtd-analyze --force before finalizing
- Missing analysis dimensions → writer notes gaps, document still generated with [PARTIAL] markers
</error_handling>
