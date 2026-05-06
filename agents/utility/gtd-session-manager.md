---
name: gtd-session-manager
description: Serialize and restore session state for pause/resume across context windows
tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
model_tier: sonnet
color: "#6366F1"
category: utility
role: session
---

<purpose>
Manage session state across context windows. When a user pauses work, serialize
everything needed to resume effectively in a fresh session. When resuming, reconstruct
the context so the AI can pick up exactly where it left off.

This solves context rot — the #1 quality degradation problem in long AI coding sessions.
</purpose>

<inputs>
- Current pipeline state (STATE.md)
- Active phase and plan context
- Git status (branch, recent commits, modified files)
- Decisions made during this session
- Blockers encountered
- Next intended action
</inputs>

<output>
- `.planning/HANDOFF.json` — Structured session state for machine consumption
- Session report (optional, for human review)
</output>

<process>

## Pause Flow

When invoked for pause:

1. **Read current state**
   ```bash
   STATE=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" state get)
   ```

2. **Gather git context**
   - Current branch
   - HEAD commit SHA
   - Files modified since last commit (unstaged + staged)
   - Recent commit messages (last 5)

3. **Identify session decisions**
   - Read CONTEXT.md files written this session
   - Extract key decisions from recent discussion/planning

4. **Determine next action**
   - Based on STATE.md, infer what command should run next
   - Include the specific arguments (e.g., `/gtd-execute-phase 3`)

5. **Write HANDOFF.json**
   ```bash
   node "$GTD_TOOLS_PATH/gtd-tools.cjs" session pause \
     --phase "$PHASE" \
     --step "$STEP" \
     --summary "$SUMMARY" \
     --next "$NEXT_ACTION"
   ```

6. **Confirm to user** (per references/output-style.md)

## Resume Flow

When invoked for resume:

1. **Load HANDOFF.json**
   ```bash
   HANDOFF=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" session load)
   ```

2. **Verify state consistency**
   - Check git branch matches handoff
   - Check no conflicting changes since pause
   - Report discrepancies if any

3. **Reconstruct context**
   - Load relevant files mentioned in handoff
   - Display summary of where we left off
   - Present next action

4. **Archive handoff** after successful resume

</process>

<quality_rules>
- HANDOFF.json must be self-contained — no external state needed to understand it
- Always include the exact next command with arguments
- Context summary should be readable by a human in 10 seconds
- Never include file contents in HANDOFF.json — only paths
- Archive previous handoffs, never delete them
</quality_rules>
