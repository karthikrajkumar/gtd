# Get Things Done — Custom Integration Guide

> How to embed GTD into your own application: React Monaco Editor + Chat System + Custom Orchestrator

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Three Integration Approaches](#three-integration-approaches)
- [Approach 1: SDK Backend Integration (Simplest)](#approach-1-sdk-backend-integration)
- [Approach 2: Agent Prompts as a Library (Most Flexible)](#approach-2-agent-prompts-as-a-library)
- [Approach 3: MCP Server (Most Modern)](#approach-3-mcp-server)
- [Chat Command Router](#chat-command-router)
- [Frontend Integration (React + Monaco)](#frontend-integration-react--monaco)
- [Example: Full Stack Integration](#example-full-stack-integration)

---

## Architecture Overview

Your setup:
```
┌─────────────────────────────────────────────────────┐
│  YOUR APPLICATION                                    │
│                                                      │
│  ┌────────────────┐  ┌──────────────────────────┐   │
│  │ React Monaco   │  │ Chat System              │   │
│  │ Editor         │  │ (Claude / OpenAI)        │   │
│  │                │  │                          │   │
│  │ [code editing] │  │ User: /gtd-scan          │   │
│  │                │  │ AI: Scanning codebase... │   │
│  └────────┬───────┘  └────────────┬─────────────┘   │
│           │                       │                  │
│  ┌────────▼───────────────────────▼─────────────┐   │
│  │           YOUR ORCHESTRATOR                   │   │
│  │  (routes commands, manages context, calls AI) │   │
│  └────────────────────┬─────────────────────────┘   │
│                       │                              │
└───────────────────────┼──────────────────────────────┘
                        │
         ┌──────────────▼──────────────┐
         │    GTD INTEGRATION LAYER    │
         │                             │
         │  Option A: SDK (Node.js)    │
         │  Option B: Prompt Library   │
         │  Option C: MCP Server       │
         └─────────────────────────────┘
```

**The key insight:** GTD's agents are just **Markdown files containing prompts**. The CLI tools are just **Node.js functions**. You can use both directly from your orchestrator without needing Cursor or Claude Code.

---

## Three Integration Approaches

| Approach | Complexity | Best For | How It Works |
|----------|-----------|----------|-------------|
| **SDK Backend** | Low | Quick integration | Your backend calls GTD SDK functions |
| **Prompt Library** | Medium | Full control | Load agent prompts, send to your own LLM API calls |
| **MCP Server** | Medium-High | Modern architecture | GTD runs as MCP tool provider, chat connects to it |

---

## Approach 1: SDK Backend Integration

**Simplest approach.** Your Node.js backend imports the GTD SDK and calls it.

### Install

```bash
npm install @karthikrajkumar.kannan/get-things-done
npm install @karthikrajkumar.kannan/get-things-done-sdk
```

### Backend Integration

```typescript
// your-backend/services/gtd-service.ts

import { GTD } from '@karthikrajkumar.kannan/get-things-done-sdk';
import path from 'path';

export class GTDService {
  private gtd: GTD;

  constructor(projectDir: string) {
    this.gtd = new GTD({
      projectDir,
      autoMode: true,  // Skip human review gates (your chat handles review)
      format: 'standard',
    });

    // Forward events to your chat system
    this.gtd.on((event) => {
      this.emitToChatUI(event);
    });
  }

  // Called when user types /gtd-scan in your chat
  async handleCommand(command: string, args: string[] = []) {
    switch (command) {
      case 'gtd-scan':
        return await this.gtd.scan();

      case 'gtd-create-tdd':
        return await this.gtd.generateDocument('tdd');

      case 'gtd-create-all':
        return await this.gtd.generateAll();

      case 'gtd-drift':
        return await this.gtd.detectDrift();

      case 'gtd-status':
        return await this.gtd.getStatus();

      default:
        return { error: `Unknown command: ${command}` };
    }
  }

  private emitToChatUI(event: any) {
    // Send to your WebSocket/SSE connection
    // e.g., io.emit('gtd-event', event);
  }
}
```

### Wire to Your Chat System

```typescript
// your-backend/routes/chat.ts

import { GTDService } from '../services/gtd-service';

const gtdService = new GTDService('/path/to/user/project');

// When your chat system receives a /gtd-* command
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  // Check if it's a GTD command
  if (message.startsWith('/gtd-')) {
    const [command, ...args] = message.slice(1).split(' ');
    const result = await gtdService.handleCommand(command, args);
    return res.json({ type: 'gtd-result', result });
  }

  // Otherwise, pass to your normal Claude/OpenAI chat
  // ...
});
```

---

## Approach 2: Agent Prompts as a Library

**Most flexible.** Load GTD agent definitions as system prompts and send them to Claude/OpenAI through YOUR existing API calls.

This is the most powerful approach because you control:
- Which LLM to use (Claude, OpenAI, local models)
- How context is assembled
- How results are routed
- Token budget per call

### How It Works

```
User types: /gtd-scan
     │
     ▼
Your Orchestrator:
  1. Load agent prompt from: agents/backward/gtd-codebase-mapper.md
  2. Load workflow from: workflows/backward/scan-codebase.md
  3. Assemble context (file list, config, etc.)
  4. Send to YOUR Claude/OpenAI API call as system prompt
  5. Agent executes → produces CODEBASE-MAP.md
  6. Display result in chat
```

### Implementation

```typescript
// your-backend/services/gtd-prompt-engine.ts

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';  // or OpenAI

const GTD_BASE = path.join(__dirname, 'node_modules',
  '@karthikrajkumar.kannan/get-things-done');

export class GTDPromptEngine {
  private anthropic: Anthropic;
  private projectDir: string;

  constructor(projectDir: string) {
    this.anthropic = new Anthropic();
    this.projectDir = projectDir;
  }

  /**
   * Load a GTD agent definition as a system prompt
   */
  loadAgentPrompt(agentName: string): string {
    // Map agent name to file path
    const categories = ['forward', 'backward', 'sync'];
    for (const cat of categories) {
      const agentPath = path.join(GTD_BASE, 'agents', cat, `${agentName}.md`);
      if (fs.existsSync(agentPath)) {
        return fs.readFileSync(agentPath, 'utf8');
      }
    }
    throw new Error(`Agent not found: ${agentName}`);
  }

  /**
   * Load a GTD workflow definition
   */
  loadWorkflow(workflowName: string, category: string): string {
    const wfPath = path.join(GTD_BASE, 'workflows', category, `${workflowName}.md`);
    return fs.readFileSync(wfPath, 'utf8');
  }

  /**
   * Load a GTD reference document
   */
  loadReference(refName: string): string {
    const refPath = path.join(GTD_BASE, 'references', `${refName}.md`);
    return fs.readFileSync(refPath, 'utf8');
  }

  /**
   * Execute a GTD agent by sending its prompt to Claude
   */
  async executeAgent(agentName: string, userContext: string): Promise<string> {
    const agentPrompt = this.loadAgentPrompt(agentName);

    // Load relevant references mentioned in the agent
    const refs = this.extractReferences(agentPrompt);
    const refContent = refs.map(r => this.loadReference(r)).join('\n\n---\n\n');

    const systemPrompt = `${agentPrompt}\n\n---\n\nREFERENCES:\n${refContent}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userContext }
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Run the codebase scan workflow
   */
  async scan(): Promise<string> {
    // Build context: list project files
    const fileList = this.getFileList();
    const packageJson = this.readFileOr('package.json', '{}');

    const context = `
Scan the codebase at: ${this.projectDir}

Files in project:
${fileList}

package.json:
${packageJson}

Write the output as a CODEBASE-MAP.md document.
`;

    return await this.executeAgent('gtd-codebase-mapper', context);
  }

  /**
   * Generate a document
   */
  async generateDocument(type: string, analysisContext: string): Promise<string> {
    const writerAgent = `gtd-${type}-writer`;
    const template = this.loadTemplate(type);

    const context = `
Generate a ${type.toUpperCase()} document for this project.

Analysis context:
${analysisContext}

Template to follow:
${template}

Write the complete document.
`;

    return await this.executeAgent(writerAgent, context);
  }

  // --- Helpers ---

  private getFileList(): string {
    // Recursively list files (respect .gitignore)
    const { execSync } = require('child_process');
    try {
      return execSync('git ls-files', {
        cwd: this.projectDir,
        encoding: 'utf8'
      });
    } catch {
      return execSync('find . -type f -not -path "./.git/*" -not -path "*/node_modules/*"', {
        cwd: this.projectDir,
        encoding: 'utf8'
      });
    }
  }

  private readFileOr(filename: string, fallback: string): string {
    try {
      return fs.readFileSync(path.join(this.projectDir, filename), 'utf8');
    } catch {
      return fallback;
    }
  }

  private loadTemplate(type: string): string {
    const tmplPath = path.join(GTD_BASE, 'templates', 'backward', type, 'standard.md');
    return fs.existsSync(tmplPath) ? fs.readFileSync(tmplPath, 'utf8') : '';
  }

  private extractReferences(agentPrompt: string): string[] {
    const matches = agentPrompt.match(/@references\/([a-z-]+\.md)/g) || [];
    return matches.map(m => m.replace('@references/', ''));
  }
}
```

### Using with OpenAI Instead of Claude

```typescript
// Just swap the API call:

import OpenAI from 'openai';

const openai = new OpenAI();

async executeAgent(agentName: string, userContext: string): Promise<string> {
  const agentPrompt = this.loadAgentPrompt(agentName);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: agentPrompt },
      { role: 'user', content: userContext }
    ],
    max_tokens: 16000,
  });

  return response.choices[0].message.content || '';
}
```

---

## Approach 3: MCP Server

**Most modern.** GTD runs as an MCP (Model Context Protocol) server that your chat system connects to as a tool provider.

### Architecture

```
┌──────────────────────────────┐
│ Your Chat UI                 │
│ (React + Monaco)             │
└──────────┬───────────────────┘
           │
┌──────────▼───────────────────┐
│ Your Orchestrator             │
│ (calls Claude/OpenAI with    │
│  MCP tools available)        │
└──────────┬───────────────────┘
           │ MCP Protocol
┌──────────▼───────────────────┐
│ GTD MCP Server               │
│                              │
│ Tools exposed:               │
│   gtd_scan()                │
│   gtd_analyze(dimensions)   │
│   gtd_generate(doc_type)    │
│   gtd_verify(doc_type)      │
│   gtd_drift()               │
│   gtd_status()              │
│   gtd_config(key, value)    │
└──────────────────────────────┘
```

### MCP Server Implementation

```typescript
// gtd-mcp-server.ts
// Run as: node gtd-mcp-server.ts

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { execSync } from 'child_process';
import path from 'path';

const GTD_TOOLS = path.join(__dirname, 'node_modules',
  '@karthikrajkumar.kannan/get-things-done', 'bin', 'gtd-tools.cjs');

const server = new Server({
  name: 'gtd-server',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

// Helper: run gtd-tools.cjs command
function runGTD(command: string, args: string[] = [], cwd: string = process.cwd()): string {
  return execSync(
    `node "${GTD_TOOLS}" ${command} ${args.join(' ')}`,
    { encoding: 'utf8', cwd, timeout: 30000 }
  ).trim();
}

// List available tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'gtd_scan',
      description: 'Scan and map a codebase — detects languages, frameworks, entry points',
      inputSchema: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Project directory path' },
          force: { type: 'boolean', description: 'Force re-scan' },
        },
        required: ['projectDir'],
      },
    },
    {
      name: 'gtd_analyze',
      description: 'Deep code analysis across 7 dimensions',
      inputSchema: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Project directory path' },
          focus: { type: 'string', description: 'Specific dimension to analyze' },
        },
        required: ['projectDir'],
      },
    },
    {
      name: 'gtd_generate',
      description: 'Generate a technical document (tdd, hld, lld, capacity, system-design, api-docs, runbook)',
      inputSchema: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Project directory path' },
          docType: { type: 'string', description: 'Document type', enum: ['tdd', 'hld', 'lld', 'capacity', 'system-design', 'api-docs', 'runbook'] },
          format: { type: 'string', description: 'Format', enum: ['standard', 'enterprise', 'startup', 'compliance'] },
        },
        required: ['projectDir', 'docType'],
      },
    },
    {
      name: 'gtd_status',
      description: 'Get GTD pipeline status',
      inputSchema: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Project directory path' },
        },
        required: ['projectDir'],
      },
    },
    {
      name: 'gtd_drift',
      description: 'Detect spec-code drift',
      inputSchema: {
        type: 'object',
        properties: {
          projectDir: { type: 'string', description: 'Project directory path' },
        },
        required: ['projectDir'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  const cwd = (args as any).projectDir || process.cwd();

  try {
    switch (name) {
      case 'gtd_scan': {
        const result = runGTD('init', ['scan-codebase'], cwd);
        return { content: [{ type: 'text', text: `Scan context:\n${result}` }] };
      }
      case 'gtd_analyze': {
        const focus = (args as any).focus;
        const a = focus ? ['analyze-codebase', '--focus', focus] : ['analyze-codebase'];
        const result = runGTD('init', a, cwd);
        return { content: [{ type: 'text', text: `Analysis context:\n${result}` }] };
      }
      case 'gtd_generate': {
        const docType = (args as any).docType;
        const format = (args as any).format || 'standard';
        const result = runGTD('init', ['generate-document', docType, '--format', format], cwd);
        return { content: [{ type: 'text', text: `Generation context:\n${result}` }] };
      }
      case 'gtd_status': {
        const state = runGTD('state', ['get'], cwd);
        return { content: [{ type: 'text', text: state }] };
      }
      case 'gtd_drift': {
        const drift = runGTD('drift', ['check'], cwd);
        return { content: [{ type: 'text', text: drift }] };
      }
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }] };
    }
  } catch (err: any) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

// Start server
const transport = new StdioServerTransport();
server.connect(transport);
```

---

## Chat Command Router

Regardless of which approach you use, your chat system needs to detect `/gtd-*` commands:

```typescript
// your-frontend/hooks/useGTDCommands.ts

const GTD_COMMANDS = [
  // Backward
  'gtd-scan', 'gtd-analyze', 'gtd-create-tdd', 'gtd-create-hld',
  'gtd-create-lld', 'gtd-create-capacity', 'gtd-create-sysdesign',
  'gtd-create-api-docs', 'gtd-create-runbook', 'gtd-create-all',
  'gtd-verify-docs', 'gtd-update-docs',
  // Forward
  'gtd-new-project', 'gtd-plan-phase', 'gtd-execute-phase',
  'gtd-deploy-local', 'gtd-test-phase',
  // Sync
  'gtd-drift', 'gtd-sync', 'gtd-audit',
  // Utility
  'gtd-help', 'gtd-status', 'gtd-settings',
];

export function isGTDCommand(message: string): boolean {
  if (!message.startsWith('/')) return false;
  const cmd = message.slice(1).split(' ')[0];
  return GTD_COMMANDS.includes(cmd);
}

export function parseGTDCommand(message: string): { command: string; args: string[] } {
  const parts = message.slice(1).split(' ');
  return { command: parts[0], args: parts.slice(1) };
}

// Autocomplete for Monaco
export function getGTDCompletions(prefix: string) {
  return GTD_COMMANDS
    .filter(cmd => cmd.startsWith(prefix.replace('/', '')))
    .map(cmd => ({
      label: `/${cmd}`,
      kind: 'function',
      detail: 'GTD Command',
    }));
}
```

---

## Frontend Integration (React + Monaco)

### Command Palette in Chat

```tsx
// ChatInput.tsx

import { isGTDCommand, parseGTDCommand, getGTDCompletions } from './useGTDCommands';

function ChatInput({ onSendMessage, onGTDCommand }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (value: string) => {
    setInput(value);
    
    // Show GTD command autocomplete
    if (value.startsWith('/gtd')) {
      setSuggestions(getGTDCompletions(value));
    } else {
      setSuggestions([]);
    }
  };

  const handleSubmit = () => {
    if (isGTDCommand(input)) {
      // Route to GTD handler
      const { command, args } = parseGTDCommand(input);
      onGTDCommand(command, args);
    } else {
      // Normal chat message
      onSendMessage(input);
    }
    setInput('');
  };

  return (
    <div>
      {suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map(s => (
            <div key={s.label} onClick={() => setInput(s.label)}>
              {s.label} — {s.detail}
            </div>
          ))}
        </div>
      )}
      <input
        value={input}
        onChange={e => handleInputChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Type a message or /gtd-command..."
      />
    </div>
  );
}
```

### Display GTD Output in Monaco

```tsx
// When GTD generates a document, show it in a new Monaco tab

function handleGTDResult(result: any) {
  if (result.outputPath) {
    // Open the generated document in Monaco editor
    const content = fs.readFileSync(result.outputPath, 'utf8');
    openNewTab({
      filename: path.basename(result.outputPath),
      language: 'markdown',
      content,
    });
  }
}
```

---

## Example: Full Stack Integration

### The Simplest Possible Integration

If your app has a Node.js backend and a React frontend with a chat panel:

```typescript
// Backend: 5 lines to add GTD

const gtdTools = require('@karthikrajkumar.kannan/get-things-done/bin/gtd-tools.cjs');
const { execSync } = require('child_process');

app.post('/api/gtd/:command', (req, res) => {
  const { command } = req.params;
  const { projectDir, args = [] } = req.body;
  
  try {
    const result = execSync(
      `node "${require.resolve('@karthikrajkumar.kannan/get-things-done/bin/gtd-tools.cjs')}" ${command} ${args.join(' ')}`,
      { encoding: 'utf8', cwd: projectDir, timeout: 30000 }
    );
    res.json({ success: true, data: JSON.parse(result) });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});
```

```typescript
// Frontend: call it from your chat

async function handleGTDCommand(command: string, args: string[]) {
  const response = await fetch(`/api/gtd/init`, {
    method: 'POST',
    body: JSON.stringify({ 
      projectDir: currentProjectPath,
      args: [command, ...args]
    }),
  });
  const result = await response.json();
  addChatMessage('system', `GTD: ${JSON.stringify(result.data, null, 2)}`);
}
```

### The Powerful Integration (Prompt Library)

For full agent execution through your own LLM calls:

```typescript
// Your orchestrator uses GTD agent prompts as system prompts

async function executeGTDScan(projectDir: string) {
  // 1. Load the agent prompt
  const agentPrompt = fs.readFileSync(
    require.resolve('@karthikrajkumar.kannan/get-things-done/agents/backward/gtd-codebase-mapper.md'),
    'utf8'
  );

  // 2. Build context
  const fileList = execSync('git ls-files', { cwd: projectDir, encoding: 'utf8' });
  const pkgJson = fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8');

  // 3. Send to YOUR LLM (Claude, OpenAI, local model — your choice)
  const response = await yourLLMClient.chat({
    systemPrompt: agentPrompt,
    userMessage: `Scan this project:\n\nFiles:\n${fileList}\n\npackage.json:\n${pkgJson}`,
    tools: ['read_file', 'write_file', 'run_command'],  // Your tool definitions
  });

  // 4. The agent follows its instructions and produces CODEBASE-MAP.md
  return response;
}
```

---

## Which Approach Should You Choose?

| Your Situation | Recommended Approach |
|---------------|---------------------|
| Quick proof of concept | **Approach 1** (SDK) — 5 lines of backend code |
| You want full control over LLM calls | **Approach 2** (Prompt Library) — load agents as prompts |
| You're building an IDE with tool-use | **Approach 3** (MCP Server) — most scalable |
| You use Claude with tool_use API | **Approach 2** — agents have tool lists in frontmatter |
| You use OpenAI function calling | **Approach 2** — adapt agent tools to OpenAI functions |

**The beauty of GTD's architecture:** The agents are just Markdown prompts. The tools are just Node.js functions. They work with ANY LLM, ANY framework, ANY orchestrator.

---

*End of Custom Integration Guide*
