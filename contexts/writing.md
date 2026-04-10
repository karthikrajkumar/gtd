# Context Profile: Writing

> Loaded by document writer agents. Defines what context to provide when spawning writers.

## Required Context
- `.planning/CODEBASE-MAP.md` — Project overview
- `.planning/analysis/*.md` — Analysis artifacts (dimension-specific)
- Template file for the document type and format
- `.planning/config.json` → `documents` section — Format, snippets, diagram settings

## References to Load
- `@references/document-standards.md` — Metadata, quality rules, versioning
- `@references/diagram-conventions.md` — Mermaid style guide

## Context Budget Allocation (200K window)
```
System prompt + agent definition:  5K  (2.5%)
CODEBASE-MAP.md:                   8K  (4%)
Analysis artifacts (3-6 files):   40K  (20%)
Template:                          4K  (2%)
Config:                            1K  (0.5%)
Source code reads (verification): 40K  (20%)
References:                        6K  (3%)
Reserved for output:              40K  (20%)
Buffer:                           56K  (28%)
```

## Tool Permissions
Writer agents receive: Read, Write, Bash, Grep, Glob
