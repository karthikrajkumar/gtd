---
name: gtd-ingest
description: "Import external documents into project context for AI reference"
tools:
  - Read
  - Write
  - Bash
  - WebFetch
  - Grep
  - Glob
---

# /gtd-ingest

Import external documents (files, URLs, specs) into `.planning/ingested/` so AI agents can reference them during planning and execution.

## Required Reading
@references/output-style.md

## Usage
```
/gtd-ingest <source> [--name <slug>] [--max-lines <N>]
```

**Arguments:**
- `<source>` — File path or URL to ingest
- `--name` — Override output filename
- `--max-lines` — Truncate at N lines (for very large docs)

## Process

1. Detect source type (file vs URL)

2. **If file:**
   ```bash
   node "$GTD_TOOLS_PATH/gtd-tools.cjs" ingest file "$SOURCE" --name "$NAME"
   ```

3. **If URL:**
   - Fetch content via WebFetch
   - Clean/format to markdown
   - Save with source metadata header

4. Update MANIFEST.json with ingestion record

5. Display:
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Ingested                                               │
│                                                            │
│  Source       {file or url}                                │
│  Saved to     .planning/ingested/{filename}                │
│  Size         {human readable}                             │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Reference with:
    @.planning/ingested/{filename}
```

## Examples
```
/gtd-ingest ./api-spec.yaml
/gtd-ingest https://docs.stripe.com/api/charges --name stripe-charges
/gtd-ingest ./legacy-docs/ --max-lines 500
```
