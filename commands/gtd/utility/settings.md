---
name: gtd-settings
description: "View and modify GTD configuration — models, formats, scanning rules, workflow flags."
tools:
  - Read
  - Write
  - Bash
---

# /gtd-settings

View or modify GTD configuration.

## Usage
```
/gtd-settings                      # Show all settings
/gtd-settings <key>                # Show specific setting
/gtd-settings <key> <value>        # Set a value
```

## Examples
```
/gtd-settings documents.format              # → "standard"
/gtd-settings documents.format enterprise   # Set to enterprise
/gtd-settings models.analyzer opus          # Use Opus for analysis
/gtd-settings workflow.parallelization false # Disable parallel agents
```

## Process

```bash
# Show all
node "$GTD_TOOLS_PATH/gtd-tools.cjs" config-get

# Get specific
node "$GTD_TOOLS_PATH/gtd-tools.cjs" config-get "$KEY"

# Set
node "$GTD_TOOLS_PATH/gtd-tools.cjs" config-set "$KEY" "$VALUE"
```

## Key Settings

### Backward Pipeline
| Key | Default | Description |
|-----|---------|-------------|
| `documents.format` | standard | Document format (standard, enterprise, startup, compliance) |
| `scan.exclude_patterns` | [node_modules, dist, ...] | Directories to skip during scan |
| `scan.max_files` | 10000 | Maximum files to index |
| `analysis.depth` | standard | Analysis depth (shallow, standard, deep) |
| `workflow.require_verification` | true | Run accuracy verifier before finalization |

### Forward Pipeline
| Key | Default | Description |
|-----|---------|-------------|
| `planning.granularity` | standard | Phase count (coarse: 3-5, standard: 5-8, fine: 8-12) |
| `execution.use_worktrees` | true | Use git worktrees for parallel execution |

### Models
| Key | Default | Description |
|-----|---------|-------------|
| `models.analyzer` | sonnet | Model for analysis agents |
| `models.writer` | sonnet | Model for document writers |
| `models.verifier` | haiku | Model for verification agents |
| `models.executor` | sonnet | Model for code execution agents |
