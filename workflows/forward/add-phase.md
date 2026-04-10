<purpose>
Add a new phase to the existing roadmap without disrupting current progress.
</purpose>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init add-phase "$ARGUMENTS")
```
Parse: docs_root, roadmap, args (phase description).
</step>

<step name="determine_position">
Read ROADMAP.md → determine next phase number.
Ask user: insert at position N or append to end?
</step>

<step name="create_phase">
Create phase directory: .planning/phases/{padded}-{slug}/
Update ROADMAP.md with new phase entry (status: pending).
Link requirements if provided.
</step>

<step name="report">
Display: "Phase {N} added: {name}. Run /gtd-discuss-phase {N} to begin."
</step>

</process>
