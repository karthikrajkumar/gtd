#!/usr/bin/env node

/**
 * GTD MCP Server — Exposes all Get Things Done operations as MCP tools.
 *
 * Transport: stdio (no HTTP, no deployment — runs as a local subprocess)
 *
 * Usage:
 *   node gtd-mcp-server.cjs                          # Uses cwd as project dir
 *   node gtd-mcp-server.cjs --project /path/to/dir   # Explicit project dir
 *
 * Configure in Claude Desktop (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "gtd": {
 *         "command": "node",
 *         "args": ["/path/to/gtd-mcp-server.cjs", "--project", "/path/to/your/project"]
 *       }
 *     }
 *   }
 */

'use strict';

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- Parse args ---
const args = process.argv.slice(2);
let projectDir = process.cwd();
const projectIdx = args.indexOf('--project');
if (projectIdx !== -1 && args[projectIdx + 1]) {
  projectDir = path.resolve(args[projectIdx + 1]);
}

// --- Resolve gtd-tools.cjs ---
const GTD_TOOLS = path.resolve(__dirname, '..', 'bin', 'gtd-tools.cjs');

/**
 * Run a gtd-tools.cjs command and return the result.
 */
function runGTD(command, cmdArgs = []) {
  try {
    const result = execSync(
      `node "${GTD_TOOLS}" ${command} ${cmdArgs.join(' ')}`,
      {
        encoding: 'utf8',
        cwd: projectDir,
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    ).trim();
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.stderr || err.message };
  }
}

/**
 * Read a file from the project's .planning/ directory.
 */
function readPlanningFile(filename) {
  const filePath = path.join(projectDir, '.planning', filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8');
  }
  return null;
}

// --- Define all GTD tools ---

const GTD_TOOLS_DEFINITION = [
  // === BACKWARD PIPELINE ===
  {
    name: 'gtd_scan',
    description: 'Scan and map a codebase — detects languages, frameworks, entry points, infrastructure. Run this first before any document generation.',
    inputSchema: {
      type: 'object',
      properties: {
        force: { type: 'boolean', description: 'Force re-scan even if map is current', default: false },
      },
    },
  },
  {
    name: 'gtd_analyze',
    description: 'Run deep code analysis across 7 dimensions: architecture, API, patterns, data-flow, dependencies, security, performance.',
    inputSchema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          description: 'Analyze only this dimension',
          enum: ['architecture', 'api', 'data-flow', 'dependencies', 'security', 'performance'],
        },
        force: { type: 'boolean', description: 'Force re-analysis', default: false },
      },
    },
  },
  {
    name: 'gtd_create_document',
    description: 'Generate a technical document from codebase analysis. Auto-scans and analyzes if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        doc_type: {
          type: 'string',
          description: 'Type of document to generate',
          enum: ['tdd', 'hld', 'lld', 'capacity', 'system-design', 'api-docs', 'runbook'],
        },
        format: {
          type: 'string',
          description: 'Document format/template',
          enum: ['standard', 'enterprise', 'startup', 'compliance'],
          default: 'standard',
        },
      },
      required: ['doc_type'],
    },
  },
  {
    name: 'gtd_create_all',
    description: 'Generate the complete 7-document suite (TDD, HLD, LLD, Capacity Plan, System Design, API Docs, Runbook).',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['standard', 'enterprise', 'startup', 'compliance'],
          default: 'standard',
        },
      },
    },
  },
  {
    name: 'gtd_verify_docs',
    description: 'Verify accuracy of generated documents by cross-referencing claims against actual code.',
    inputSchema: {
      type: 'object',
      properties: {
        doc_type: {
          type: 'string',
          description: 'Document to verify (or omit for all)',
          enum: ['tdd', 'hld', 'lld', 'capacity', 'system-design', 'api-docs', 'runbook'],
        },
      },
    },
  },
  {
    name: 'gtd_update_docs',
    description: 'Incrementally update documents based on code changes — only regenerates affected sections.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'Git commit to compare against (default: last generation)' },
        doc_type: { type: 'string', description: 'Update specific document only' },
      },
    },
  },

  // === FORWARD PIPELINE ===
  {
    name: 'gtd_new_project',
    description: 'Initialize a new project from an idea — adaptive questioning, research, requirements, roadmap.',
    inputSchema: {
      type: 'object',
      properties: {
        idea: { type: 'string', description: 'Project idea description' },
        auto: { type: 'boolean', description: 'Skip interactive questions, use defaults', default: false },
      },
    },
  },
  {
    name: 'gtd_plan_phase',
    description: 'Research and create a detailed execution plan for a specific phase.',
    inputSchema: {
      type: 'object',
      properties: {
        phase: { type: 'number', description: 'Phase number to plan' },
      },
      required: ['phase'],
    },
  },
  {
    name: 'gtd_execute_phase',
    description: 'Execute a phase plan — generate code, run tests, commit atomically per task.',
    inputSchema: {
      type: 'object',
      properties: {
        phase: { type: 'number', description: 'Phase number to execute' },
        wave: { type: 'number', description: 'Execute specific wave only' },
      },
      required: ['phase'],
    },
  },
  {
    name: 'gtd_deploy_local',
    description: 'Deploy the project locally — auto-detects Docker, npm, Python, Go, Rust.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gtd_test',
    description: 'Run the project test suite — auto-detects Jest, Vitest, pytest, Go test, Cargo test, RSpec.',
    inputSchema: {
      type: 'object',
      properties: {
        phase: { type: 'number', description: 'Phase to test (optional)' },
      },
    },
  },

  // === SYNC ===
  {
    name: 'gtd_drift',
    description: 'Detect drift between specs/docs and actual code. Finds additions, removals, mutations, structural changes.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'Compare against this git commit' },
      },
    },
  },
  {
    name: 'gtd_sync',
    description: 'Auto-reconcile spec-code drift — detect, plan reconciliation, apply changes.',
    inputSchema: {
      type: 'object',
      properties: {
        strategy: {
          type: 'string',
          description: 'Reconciliation strategy',
          enum: ['code-wins', 'spec-wins', 'interactive'],
          default: 'code-wins',
        },
        auto: { type: 'boolean', description: 'Skip confirmation, auto-apply', default: false },
      },
    },
  },
  {
    name: 'gtd_audit',
    description: 'Full alignment audit — coverage matrix of requirements to code to docs to tests.',
    inputSchema: {
      type: 'object',
      properties: {
        compliance: {
          type: 'string',
          description: 'Compliance framework to check against',
          enum: ['soc2', 'iso27001'],
        },
      },
    },
  },

  // === UTILITY ===
  {
    name: 'gtd_status',
    description: 'Get full pipeline status — forward progress, backward documents, sync alignment, analysis cache.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gtd_config',
    description: 'Get or set GTD configuration values.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Config key (dot notation, e.g., "documents.format")' },
        value: { type: 'string', description: 'Value to set (omit to read)' },
      },
      required: ['key'],
    },
  },
  {
    name: 'gtd_read_document',
    description: 'Read a generated document or planning artifact from .planning/ directory.',
    inputSchema: {
      type: 'object',
      properties: {
        filename: {
          type: 'string',
          description: 'File to read (e.g., "documents/TDD.md", "CODEBASE-MAP.md", "analysis/ARCHITECTURE-ANALYSIS.md")',
        },
      },
      required: ['filename'],
    },
  },
  {
    name: 'gtd_list_documents',
    description: 'List all generated documents with their status (pending, drafting, finalized, stale).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gtd_scale_detect',
    description: 'Detect project tier (micro/small/medium/large/enterprise) and get adaptive configuration.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// --- Tool execution ---

async function executeTool(name, toolArgs) {
  switch (name) {
    // BACKWARD
    case 'gtd_scan': {
      const a = ['scan-codebase'];
      if (toolArgs.force) a.push('--force');
      const ctx = runGTD('init', a);
      if (!ctx.success) return `Error: ${ctx.error}`;
      return `Scan context loaded for project at ${projectDir}.\n\nUse the codebase mapper agent instructions from the scan-codebase workflow to produce CODEBASE-MAP.md.\n\nContext:\n${ctx.data.slice(0, 3000)}`;
    }

    case 'gtd_analyze': {
      const a = ['analyze-codebase'];
      if (toolArgs.focus) a.push('--focus', toolArgs.focus);
      if (toolArgs.force) a.push('--force');
      const ctx = runGTD('init', a);
      return ctx.success ? `Analysis context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_create_document': {
      const a = ['generate-document', toolArgs.doc_type];
      if (toolArgs.format) a.push('--format', toolArgs.format);
      const ctx = runGTD('init', a);
      return ctx.success ? `Document generation context for ${toolArgs.doc_type}:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_create_all': {
      const a = ['create-all'];
      if (toolArgs.format) a.push('--format', toolArgs.format);
      const ctx = runGTD('init', a);
      return ctx.success ? `Create-all context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_verify_docs': {
      const a = ['verify-document'];
      if (toolArgs.doc_type) a.push(toolArgs.doc_type);
      const ctx = runGTD('init', a);
      return ctx.success ? `Verification context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_update_docs': {
      const a = ['incremental-update'];
      if (toolArgs.since) a.push('--since', toolArgs.since);
      if (toolArgs.doc_type) a.push('--doc', toolArgs.doc_type);
      const ctx = runGTD('init', a);
      return ctx.success ? `Update context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    // FORWARD
    case 'gtd_new_project': {
      const a = ['new-project'];
      if (toolArgs.auto) a.push('--auto');
      const ctx = runGTD('init', a);
      return ctx.success ? `New project context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_plan_phase': {
      const ctx = runGTD('init', ['plan-phase', String(toolArgs.phase)]);
      return ctx.success ? `Plan phase ${toolArgs.phase} context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_execute_phase': {
      const a = ['execute-phase', String(toolArgs.phase)];
      if (toolArgs.wave) a.push('--wave', String(toolArgs.wave));
      const ctx = runGTD('init', a);
      return ctx.success ? `Execute phase ${toolArgs.phase} context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_deploy_local': {
      const deploy = runGTD('deploy', ['detect']);
      const ctx = runGTD('init', ['deploy-local']);
      return `Deploy detection:\n${deploy.data || deploy.error}\n\nContext:\n${ctx.data || ctx.error}`;
    }

    case 'gtd_test': {
      const testInfo = runGTD('test', ['detect']);
      const a = toolArgs.phase ? ['test-phase', String(toolArgs.phase)] : ['test-phase'];
      const ctx = runGTD('init', a);
      return `Test framework:\n${testInfo.data || testInfo.error}\n\nContext:\n${ctx.data || ctx.error}`;
    }

    // SYNC
    case 'gtd_drift': {
      const check = runGTD('drift', ['check']);
      const context = runGTD('drift', ['context']);
      return `Drift check:\n${check.data || check.error}\n\nDrift context:\n${context.data || context.error}`;
    }

    case 'gtd_sync': {
      const a = ['sync'];
      if (toolArgs.auto) a.push('--auto');
      if (toolArgs.strategy) a.push('--strategy', toolArgs.strategy);
      const ctx = runGTD('init', a);
      return ctx.success ? `Sync context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    case 'gtd_audit': {
      const a = ['audit'];
      if (toolArgs.compliance) a.push('--compliance', toolArgs.compliance);
      const ctx = runGTD('init', a);
      return ctx.success ? `Audit context:\n${ctx.data.slice(0, 3000)}` : `Error: ${ctx.error}`;
    }

    // UTILITY
    case 'gtd_status': {
      const state = runGTD('state', ['get']);
      const analysis = runGTD('analysis', ['status']);
      const docs = runGTD('doc', ['list']);
      return `State:\n${state.data || state.error}\n\nAnalysis:\n${analysis.data || analysis.error}\n\nDocuments:\n${docs.data || docs.error}`;
    }

    case 'gtd_config': {
      if (toolArgs.value !== undefined) {
        const result = runGTD('config-set', [toolArgs.key, toolArgs.value]);
        return result.success ? `Set ${toolArgs.key} = ${toolArgs.value}` : `Error: ${result.error}`;
      } else {
        const result = runGTD('config-get', [toolArgs.key]);
        return result.success ? `${toolArgs.key} = ${result.data}` : `Error: ${result.error}`;
      }
    }

    case 'gtd_read_document': {
      const content = readPlanningFile(toolArgs.filename);
      if (content) return content;
      return `File not found: .planning/${toolArgs.filename}`;
    }

    case 'gtd_list_documents': {
      const result = runGTD('doc', ['list']);
      return result.success ? result.data : `Error: ${result.error}`;
    }

    case 'gtd_scale_detect': {
      const result = runGTD('scale', ['detect']);
      return result.success ? result.data : `Error: ${result.error}`;
    }

    default:
      return `Unknown tool: ${name}`;
  }
}

// --- Create MCP Server ---

const server = new Server(
  {
    name: 'gtd-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: GTD_TOOLS_DEFINITION };
});

// Call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: toolArgs } = request.params;

  try {
    const result = await executeTool(name, toolArgs || {});
    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `GTD Error: ${err.message}` }],
      isError: true,
    };
  }
});

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running on stdio — it reads from stdin and writes to stdout
}

main().catch((err) => {
  process.stderr.write(`GTD MCP Server error: ${err.message}\n`);
  process.exit(1);
});
