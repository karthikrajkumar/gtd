<purpose>
Generate the complete 7-document suite in one orchestrated run. Scans, analyzes, then generates all documents with wave-based ordering.
</purpose>

<process>

<step name="initialize">
Load context via: `gtd-tools.cjs init create-all`
Parse: config, state, git, analysis_status, args (--format, --auto, --parallel)
</step>

<step name="prerequisites">
1. If no CODEBASE-MAP.md → run scan-codebase workflow
2. Check all 6 analysis dimensions → run analyze-codebase for any stale dimensions
This ensures all analysis is current before generating ANY documents.
</step>

<step name="generate_documents">
Generate documents in dependency order:

**Wave 1 — Foundation documents (can be parallel):**
- TDD (architecture + dependencies)
- HLD (architecture + data-flow)
- API Docs (api surface)

**Wave 2 — Detail documents (depend on Wave 1 for cross-references):**
- LLD (architecture + api + patterns)
- System Design (all dimensions — most comprehensive)
- Capacity Plan (dependencies + performance)

**Wave 3 — Operational documents:**
- Runbook (architecture + security + dependencies)

For each document, execute the generate-document workflow with the doc type.
If --parallel is set and config.workflow.parallelization is true, run documents within the same wave concurrently.
</step>

<step name="summary">
Display:
```
✓ Full document suite generated

| Document | Status | Version | Verification |
|----------|--------|---------|-------------|
| TDD | ✓ finalized | v1.0 | 95% |
| HLD | ✓ finalized | v1.0 | 93% |
| ... | ... | ... | ... |

All documents saved to: .planning/documents/
```
</step>

</process>
