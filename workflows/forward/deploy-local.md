<purpose>
Deploy the project locally — detect method, build, start, health check.
</purpose>

<available_agent_types>
- gtd-deployer — Local deployment orchestration
</available_agent_types>

<process>

<step name="initialize">
```bash
INIT=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" init deploy-local "$ARGUMENTS")
DEPLOY=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" deploy detect)
```
Parse: method, port, config.deploy settings.
</step>

<step name="pre_deploy">
Check port availability:
```bash
PORT_CHECK=$(node "$GTD_TOOLS_PATH/gtd-tools.cjs" deploy check-port "$PORT")
```
If port in use: warn user, offer to use different port or kill existing process.
</step>

<step name="spawn_deployer">
Spawn gtd-deployer agent with project context and deployment info.
Agent handles: dependency install → build → start → health check.
Produces: DEPLOY-REPORT.md
</step>

<step name="update_state">
```bash
node "$GTD_TOOLS_PATH/gtd-tools.cjs" state update forward.status deployed
```

Display:
```
✓ Deployed locally

  Method: {method}
  URL: http://localhost:{port}
  Health: {healthy|unhealthy}

  Next: /gtd-test-phase {N} (run tests)
        /gtd-verify-work {N} (full verification)
```
</step>

</process>
