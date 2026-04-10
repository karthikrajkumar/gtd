<purpose>
Run deep code analysis across multiple dimensions. Spawns up to 7 parallel analyzer agents, each writing their output to .planning/analysis/. Only re-analyzes stale dimensions.
</purpose>

<required_reading>
@references/analysis-patterns.md
</required_reading>

<available_agent_types>
- gtd-architecture-analyzer — Architectural patterns, layers, components
- gtd-api-extractor — API endpoints, schemas, authentication
- gtd-pattern-detector — Design patterns, conventions, anti-patterns
- gtd-data-flow-tracer — Request lifecycle, events, data transformations
- gtd-dependency-analyzer — External deps, internal graph, build tools
- gtd-security-scanner — Auth, encryption, validation, security surface
- gtd-performance-profiler — Caching, bottlenecks, scaling, async patterns
</available_agent_types>

<process>

<step name="initialize" priority="first">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init analyze-codebase "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

Parse: `project_root`, `docs_root`, `config`, `state`, `git`, `codebase_map`, `analysis_status`, `args`.

Check prerequisites:
- If `codebase_map.exists` is false → Error: "No codebase map found. Run /gtd-scan first."
</step>

<step name="determine_scope">
Check which dimensions need analysis:

- If `--force` flag → analyze ALL dimensions
- If `--focus <dimension>` → analyze only that dimension
- Otherwise → analyze only STALE dimensions

```bash
STALE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" analysis stale)
```

If no stale dimensions and not forced:
  Display: "All analysis dimensions are current. Use --force to re-analyze."
  EXIT
</step>

<step name="spawn_analyzers">
For each dimension to analyze, spawn the corresponding agent:

| Dimension | Agent |
|-----------|-------|
| architecture | gtd-architecture-analyzer |
| api | gtd-api-extractor |
| data-flow | gtd-data-flow-tracer |
| dependencies | gtd-dependency-analyzer |
| security | gtd-security-scanner |
| performance | gtd-performance-profiler |

Additionally, always run pattern detection if architecture is stale:
| patterns (auto) | gtd-pattern-detector |

**Parallelization:** If `config.workflow.parallelization` is true, spawn all agents concurrently. Otherwise, spawn sequentially.

Each agent receives:
```
Analyze the codebase at: {project_root}

Context:
  - CODEBASE-MAP: {docs_root}/CODEBASE-MAP.md
  - Config: {config.analysis}
  - Git commit: {git.commit}

Write output to: {docs_root}/analysis/<DIMENSION>.md
Include YAML frontmatter with commit: {git.commit}
```
</step>

<step name="collect_results">
After all agents complete, verify outputs exist:

For each dimension that was analyzed:
  Check that the output file exists in .planning/analysis/
  Read frontmatter to verify commit hash matches current

Report any failures (agent didn't produce output).
</step>

<step name="update_state">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update backward.status analyzed
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update backward.last_analysis_commit "$(git rev-parse --short HEAD)"
```
</step>

<step name="report">
Display analysis summary:

```
✓ Analysis complete

  Dimensions analyzed: {count}
  ✓ Architecture  — {files_analyzed} files, {confidence}
  ✓ API Surface   — {endpoint_count} endpoints found
  ✓ Patterns      — {pattern_count} patterns detected
  ✓ Data Flow     — {flow_count} flows traced
  ✓ Dependencies  — {dep_count} dependencies mapped
  ✓ Security      — {concern_count} concerns flagged
  ✓ Performance   — {risk_count} bottleneck risks identified

  Run /gtd-create-<type> to generate documents from this analysis.
```
</step>

</process>

<error_handling>
- If an agent times out: mark that dimension as failed, continue with others
- If an agent produces invalid output: retry once, then mark as failed
- Partial analysis is acceptable — writers will note gaps
- If CODEBASE-MAP.md is missing: error with instruction to run /gtd-scan
</error_handling>
