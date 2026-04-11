# GTD MCP Server

> Exposes all Get Things Done operations as MCP tools via stdio transport.
> No HTTP server. No deployment. Just a local subprocess.

## 19 Tools Exposed

| Tool | Description |
|------|-------------|
| `gtd_scan` | Scan and map codebase |
| `gtd_analyze` | Deep code analysis (7 dimensions) |
| `gtd_create_document` | Generate a specific document |
| `gtd_create_all` | Generate all 7 documents |
| `gtd_verify_docs` | Verify document accuracy |
| `gtd_update_docs` | Incremental document update |
| `gtd_new_project` | Initialize from idea |
| `gtd_plan_phase` | Research + plan a phase |
| `gtd_execute_phase` | Execute phase (generate code) |
| `gtd_deploy_local` | Deploy locally |
| `gtd_test` | Run test suite |
| `gtd_drift` | Detect spec-code drift |
| `gtd_sync` | Auto-reconcile drift |
| `gtd_audit` | Full alignment audit |
| `gtd_status` | Pipeline status |
| `gtd_config` | Get/set configuration |
| `gtd_read_document` | Read a generated document |
| `gtd_list_documents` | List all documents |
| `gtd_scale_detect` | Detect project tier |

## Setup

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gtd": {
      "command": "node",
      "args": [
        "/path/to/node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs",
        "--project",
        "/path/to/your/project"
      ]
    }
  }
}
```

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "gtd": {
      "command": "node",
      "args": ["./node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs"]
    }
  }
}
```

### After npx Install (Global)

If you installed via `npx @karthikrajkumar.kannan/get-things-done --claude --global`:

```json
{
  "mcpServers": {
    "gtd": {
      "command": "gtd-mcp-server",
      "args": ["--project", "/path/to/your/project"]
    }
  }
}
```

### Custom Application (React + Monaco + Chat)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Start GTD MCP server as a subprocess
const transport = new StdioClientTransport({
  command: 'node',
  args: [
    'node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs',
    '--project', '/path/to/project'
  ],
});

const client = new Client({ name: 'my-app', version: '1.0.0' }, {});
await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(tools); // 19 GTD tools

// Call a tool
const result = await client.callTool({
  name: 'gtd_scan',
  arguments: { force: false },
});
console.log(result.content[0].text);

// Use with Claude API (pass tools as tool definitions)
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  messages: [{ role: 'user', content: 'Scan this codebase and generate a TDD' }],
  tools: tools.tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema,
  })),
});
```

## Test

```bash
# Quick test — send initialize + tools/list
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node mcp/gtd-mcp-server.cjs
```
