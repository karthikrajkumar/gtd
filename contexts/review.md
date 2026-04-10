# Context Profile: Review / Verification

> Loaded by verifier and auditor agents. Defines what context to provide for quality assurance.

## Required Context
- Draft or finalized document being verified
- `.planning/CODEBASE-MAP.md` — For component coverage checks
- `.planning/analysis/*.md` — For cross-reference validation
- Source code — For accuracy cross-referencing

## References to Load
- `@references/verification-patterns.md` — Claim categories, scoring, false positives

## Context Budget Allocation (200K window)
```
System prompt + agent definition:  5K  (2.5%)
Document being verified:          20K  (10%)
CODEBASE-MAP.md:                   8K  (4%)
Source code reads:                80K  (40%)
Analysis artifacts (for cross-ref): 20K (10%)
References:                        3K  (1.5%)
Reserved for output:              20K  (10%)
Buffer:                           44K  (22%)
```

## Tool Permissions
Verifier agents receive: Read, Bash, Grep, Glob (no Write except for verification report)
