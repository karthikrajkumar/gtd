<purpose>
Restore session from HANDOFF.json — reconstruct context so the AI can pick up exactly where the user left off. Archives the handoff after successful resume.
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
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init resume "$ARGUMENTS")
```
Parse: docs_root, config, state, git.
</step>

<step name="load_handoff">
Check for HANDOFF.json:
```bash
HANDOFF=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" session load)
```

If no HANDOFF.json exists:
```
  ✗ No saved session found

    No HANDOFF.json in .planning/. Nothing to resume.

  Next:
    → /gtd-status   see current pipeline state
    → /gtd-next     auto-detect next step
```
EXIT.
</step>

<step name="verify_consistency">
Check that the working directory matches the handoff:

1. **Git branch** — Is the current branch the same as handoff.git_branch?
   If different: warn but continue (user may have intentionally switched).

2. **Git commit** — Has the codebase changed since the handoff?
   If new commits exist since handoff.git_commit: note them.

3. **State file** — Does STATE.md match handoff expectations?
   If state has advanced beyond handoff: warn that progress was made outside the session.

Report discrepancies inline but do NOT abort (the user knows what they're doing).
</step>

<step name="reconstruct_context">
Based on handoff data, load the relevant context files:

1. Read PROJECT.md (always)
2. Read STATE.md (always)
3. If handoff.phase is set:
   - Read ROADMAP.md → extract phase description
   - Read {phase}-CONTEXT.md if exists
   - Read {phase}-RESEARCH.md if exists
   - Read active PLAN file if handoff.plan_index is set

4. Summarize what was loaded.
</step>

<step name="present_resume">
Display (per references/output-style.md):
```
╭─ GTD ─────────────────────────────────────────────────────╮
│                                                            │
│  ✓ Session restored                                       │
│                                                            │
│  Paused at    {handoff.timestamp}                          │
│  Phase        {N} — {phase name from roadmap}              │
│  Step         {handoff.step}                               │
│                                                            │
│  Context:                                                  │
│    {handoff.context_summary}                               │
│                                                            │
│  {#if decisions}                                           │
│  Decisions from last session:                              │
│    {decision 1}                                            │
│    {decision 2}                                            │
│  {/if}                                                     │
│                                                            │
│  {#if blockers}                                            │
│  ⚠ Blockers:                                              │
│    {blocker 1}                                             │
│  {/if}                                                     │
│                                                            │
╰────────────────────────────────────────────────────────────╯

  Resume with:
    → {handoff.next_action}
```

If discrepancies were found, show them BEFORE the main block:
```
  ℹ Changes since last session:
    Branch: {old} → {new}
    New commits: {count} since pause
```
</step>

<step name="archive_handoff">
After successful display, archive the handoff:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" session archive
```

This moves HANDOFF.json to .planning/session-history/ with a timestamp.
The user can re-pause anytime to create a new handoff.
</step>

</process>

<error_handling>
- HANDOFF.json corrupt/malformed → report error, suggest /gtd-status instead
- Referenced files missing (phase deleted) → skip those, note what's unavailable
- Git branch mismatch → warn but continue
</error_handling>
