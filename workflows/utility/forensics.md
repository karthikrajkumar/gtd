<purpose>
Investigate project history using git, planning artifacts, and session archives.
Answers "what changed?", "when?", "why?" with evidence-backed conclusions.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<available_agent_types>
- gtd-forensics-investigator — Deep project history investigation
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init forensics "$ARGUMENTS")
```
Parse: docs_root, config, state, git, args.
Extract question, --since, --scope.
</step>

<step name="classify_question">
Categorize the investigation:
- CHANGE — "what changed in X?"
- DECISION — "why was X chosen?"
- REGRESSION — "when did X break?"
- TIMELINE — "show history of X"

This determines which sources to prioritize.
</step>

<step name="investigate">
Spawn gtd-forensics-investigator with:
- Question and category
- Time range
- Scope (files/directories)
- Access to: git log, planning artifacts, session archives

The investigator:
1. Queries relevant sources
2. Builds an evidence timeline
3. Draws conclusions
4. Writes report
</step>

<step name="report">
Display (per references/output-style.md):
```
╭─ GTD Forensics ───────────────────────────────────────────╮
│                                                            │
│  Question: {original question}                             │
│                                                            │
│  Findings:                                                 │
│    {conclusion 1}                                          │
│    {conclusion 2}                                          │
│                                                            │
│  Timeline:                                                 │
│    {date}  {event} — {evidence ref}                        │
│    {date}  {event} — {evidence ref}                        │
│    {date}  {event} — {evidence ref}                        │
│                                                            │
│  Evidence:                                                 │
│    {count} commits, {count} artifacts examined             │
│                                                            │
╰────────────────────────────────────────────────────────────╯
```
</step>

</process>
