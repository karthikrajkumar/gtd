<purpose>
Execute the project's test suite and produce a structured report.
</purpose>

<available_agent_types>
- gtd-test-runner — Test execution and reporting
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init test-phase "$ARGUMENTS")
TEST_INFO=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" test detect)
```
Parse: framework, runCmd, testFiles, phase_number, args (--e2e, --integration, --unit).
</step>

<step name="spawn_test_runner">
Spawn gtd-test-runner agent with:
  - Test framework info
  - Phase context (if --phase specified)
  - Config.testing settings

Agent handles: discover → run → parse results → coverage → map failures.
Produces: TEST-REPORT.md
</step>

<step name="update_state">
If all tests pass:
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status tested
```

Display:
```
✓ Tests complete

  Passed: {passed}/{total}
  Coverage: {pct}%
  {#if failures > 0}
  ⚠ {failures} tests failed — use /gtd-debug to investigate
  {/if}
```
</step>

</process>
