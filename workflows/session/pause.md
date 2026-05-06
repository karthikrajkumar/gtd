<purpose>
Serialize full session state to HANDOFF.json so a fresh context window can resume seamlessly.
Solves context rot — the user can pause mid-phase, close their session, and resume later without losing any context.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-session-manager — Serialize/restore session state
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init pause "$ARGUMENTS")
```
Parse: docs_root, config, state, git.
Extract --summary flag if provided.
</step>

<step name="gather_state">
Read current pipeline state:
```bash
STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state get)
```

Determine:
- Current phase number and step (from STATE.md)
- Active plan index (if mid-execution)
- Git branch and HEAD commit
- Files modified since last commit (git status)
</step>

<step name="gather_decisions">
Look for decisions made this session:
- Recent CONTEXT.md files (modified today or since last HANDOFF)
- Config changes made this session
- Key choices surfaced during discussion/planning

Compile into a concise list of decision strings.
</step>

<step name="detect_blockers">
Check for signs of blockers:
- Failed verifications in recent output
- Unresolved debug attempts
- User-stated blockers in arguments

Compile into blockers list (may be empty).
</step>

<step name="determine_next_action">
Based on STATE.md, infer the next command:

| State | Next Action |
|-------|-------------|
| forward.status = "researched" | `/gtd-discuss-phase {N}` or `/gtd-plan-phase {N}` |
| forward.status = "discussed" | `/gtd-plan-phase {N}` |
| forward.status = "planned" | `/gtd-execute-phase {N}` |
| forward.status = "executing" | `/gtd-execute-phase {N}` (resume from plan {index}) |
| forward.status = "executed" | `/gtd-verify-work {N}` |
| forward.status = "verified" | `/gtd-ship {N}` or `/gtd-next` |
| backward.status = "scanned" | `/gtd-analyze` or `/gtd-create-*` |
| backward.status = "analyzed" | `/gtd-create-*` |

Include specific phase number and any relevant flags.
</step>

<step name="write_handoff">
Write HANDOFF.json to .planning/:

```json
{
  "version": "1.0",
  "timestamp": "{ISO 8601}",
  "phase": {current_phase},
  "step": "{current_step}",
  "plan_index": {active_plan_index_or_null},
  "decisions": ["{decision 1}", "{decision 2}"],
  "blockers": ["{blocker 1}"],
  "context_summary": "{2-3 sentence summary of where we are}",
  "files_modified_this_session": ["{file1}", "{file2}"],
  "next_action": "/gtd-{command} {args}",
  "git_branch": "{branch}",
  "git_commit": "{short_sha}"
}
```

The context_summary should be written as if briefing a colleague:
"Phase 3 execution in progress. Plans 1 and 2 are complete (auth + CRUD endpoints).
Plan 3 (PDF export) is next. Using pdfkit library per research recommendation."
</step>

<step name="confirm">
Display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Session paused                                         │
│                                                            │
│  Saved to     .planning/HANDOFF.json                       │
│  Phase        {N} — {name}                                 │
│  Step         {step}                                       │
│  Decisions    {count} captured                             │
│                                                            │
│  To resume:                                                │
│    Open a fresh session and run /gtd-resume                │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
</step>

</process>

<error_handling>
- No .planning/ directory → Error: "No GTD project found. Run /gtd-new-project first."
- STATE.md missing → Create minimal handoff with git state only
- Git not available → Proceed without git fields, note in handoff
</error_handling>
