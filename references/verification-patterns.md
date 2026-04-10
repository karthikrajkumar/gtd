# Verification Patterns Reference

> Methodology for verifying generated document accuracy.
> Used by `gtd-accuracy-verifier` and `gtd-completeness-auditor`.

---

## What is a Verifiable Claim?

A **verifiable claim** is a factual statement that can be checked against the codebase:

| Verifiable | Example | How to Check |
|-----------|---------|--------------|
| ✓ Yes | "Auth handled in src/middleware/auth.js" | Check file exists and contains auth logic |
| ✓ Yes | "Uses Express 4.21" | Check package.json |
| ✓ Yes | "5 REST endpoints" | Count route definitions |
| ✓ Yes | "PostgreSQL via Prisma" | Check prisma/schema.prisma |
| ✗ No | "This is a well-designed system" | Opinion — cannot verify |
| ✗ No | "Handles high traffic" | No performance data to check |
| ✗ No | "Should be refactored" | Recommendation — not a claim |

## Confidence Score Methodology

```
confidence = verified_claims / (total_claims - unverifiable_claims) × 100

Ratings:
  95-100%  → Excellent — document is highly trustworthy
  90-95%   → Good — minor corrections needed
  80-90%   → Acceptable — review flagged sections
  70-80%   → Needs revision — significant inaccuracies
  Below 70% → Unreliable — recommend regeneration with /gtd-analyze --force
```

## Common False Positive Patterns

These patterns LOOK like errors but are often legitimate — verify carefully:

1. **File path with different extension** — `auth.js` vs `auth.ts` (transpilation)
2. **Version ranges** — "Express ^4.18" in package.json, doc says "Express 4.21" (resolved version)
3. **Generated files** — Paths in `dist/` or `.next/` may not exist until build
4. **Aliased imports** — `@/lib/auth` may resolve to `src/lib/auth.ts`
5. **Workspace paths** — Monorepo paths may include package prefix

## Verification Priority

When time-constrained, verify in this priority order:

1. **File paths** — Most common error, easiest to check
2. **Dependency versions** — Frequently hallucinated with wrong minor/patch
3. **API endpoints** — Route paths and methods must be exact
4. **Code snippets** — Most expensive to verify but most impactful if wrong
5. **Architecture claims** — Hardest to verify definitively

## Per-Section Verification Depth

| Document Type | High-Scrutiny Sections | Lower-Scrutiny Sections |
|--------------|----------------------|------------------------|
| TDD | Architecture, API Design, Data Model | Executive Summary, Limitations |
| HLD | Subsystems, Integrations | Design Decisions |
| LLD | Module Specs, Signatures, Queries | Overview |
| API Docs | Endpoints, Examples, Auth | Overview, Rate Limits |
| System Design | Architecture, Security, Deployment | Evolution |

---

*End of Verification Patterns Reference*
