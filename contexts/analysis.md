# Context Profile: Analysis

> Loaded by analyzer agents. Defines what context to provide when spawning analysis agents.

## Required Context
- `.planning/CODEBASE-MAP.md` — Project structure and framework detection
- `.planning/config.json` → `analysis` section — Depth, dimensions, language settings

## References to Load
- `@references/analysis-patterns.md` — Output format, file reading strategy, pattern detection
- `@references/framework-signatures.md` — Framework detection indicators
- `@references/language-analyzers.md` — Language-specific conventions

## Context Budget Allocation (200K window)
```
System prompt + agent definition:  5K  (2.5%)
CODEBASE-MAP.md:                   8K  (4%)
Config:                            1K  (0.5%)
References (loaded as needed):    10K  (5%)
Source code reads:                80K  (40%)
Reserved for output:              40K  (20%)
Buffer:                           56K  (28%)
```

## Tool Permissions
All analyzer agents receive: Read, Bash, Grep, Glob (no Write except for their output file)
