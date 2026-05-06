---
name: gtd-scan
description: "Scan project for security issues — secrets in code, sensitive files"
tools:
  - Read
  - Bash
  - Grep
  - Glob
---

# /gtd-scan

Scan the project for potential security issues: hardcoded secrets, sensitive files that shouldn't be committed, exposed credentials.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-scan [--fix]
```

**Flags:**
- `--fix` — Auto-add findings to .gitignore and suggest .env.example patterns

## Process

1. Run security scanner:
```bash
REPORT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" security scan)
```

2. Display results (per references/output-style.md):

**If clean:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Security scan passed                                   │
│                                                            │
│  Files scanned    {count}                                  │
│  Issues found     0                                        │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```

**If issues found:**
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ⚠ Security issues found                                  │
│                                                            │
│  Files scanned    {count}                                  │
│  Critical         {count}                                  │
│  High             {count}                                  │
│                                                            │
│  Critical:                                                 │
│    {file}:{line} — potential secret                        │
│    {file}:{line} — potential secret                        │
│                                                            │
│  High:                                                     │
│    {file} — sensitive file in repo                         │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Fix with:
    → /gtd-scan --fix    add to .gitignore + create .env.example
```

3. If `--fix`:
   - Add sensitive files to .gitignore
   - Create .env.example from .env (with values replaced by placeholders)
   - Remove sensitive files from git tracking (git rm --cached)
