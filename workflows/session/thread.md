<purpose>
Manage persistent context threads — running notes about a topic that persist across
sessions. Unlike backlog (tasks) or seeds (future ideas), threads are living documents
that accumulate knowledge over time.
</purpose>

<required_reading>
@references/output-style.md
</required_reading>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init thread "$ARGUMENTS")
```
Parse: docs_root, config, state, args.
Extract subcommand: create, append, list, read.
</step>

<step name="dispatch">

**create:**
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" backlog create-thread --name "$NAME" --description "$DESC"
```
Creates `.planning/threads/{slug}/META.json` and `THREAD.md`.

**append:**
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" backlog append-thread --slug "$SLUG" --content "$CONTENT"
```
Adds timestamped entry to THREAD.md.

**list:**
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" backlog list-threads
```
Shows all threads with metadata.

**read:**
Read and display `.planning/threads/{slug}/THREAD.md`.

</step>

<step name="display">
Display result per references/output-style.md (see command definition for templates).
</step>

</process>
