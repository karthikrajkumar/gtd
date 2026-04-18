#!/usr/bin/env node

/**
 * MCP Bridge — HTTP-to-stdio proxy for gtd-mcp-server.cjs
 *
 * Runs INSIDE each Docker container. Spawns the GTD MCP server as a child
 * process (stdio transport) and exposes it over HTTP so the orchestrator
 * can reach it from outside the container.
 *
 * Endpoints:
 *   POST /mcp/tools/list   — List available GTD tools
 *   POST /mcp/tools/call   — Call a GTD tool { name, arguments }
 *   GET  /mcp/health       — Bridge + child process health
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { spawn, type ChildProcess, execFile } from 'node:child_process';
import { resolve, join, normalize, isAbsolute } from 'node:path';
import { promises as fs } from 'node:fs';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const PORT = parseInt(process.env.MCP_BRIDGE_PORT ?? '3100', 10);
const GTD_MCP_PATH =
  process.env.GTD_MCP_PATH ??
  resolve('/usr/local/lib/node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs');
const PROJECT_DIR = process.env.GTD_PROJECT ?? '/workspace';
const MAX_RESTARTS = 3;
const REQUEST_TIMEOUT_MS = 65_000; // GTD uses 60s execSync timeout

// --- JSON-RPC types ---

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

// --- Pending request tracking ---

interface PendingRequest {
  resolve: (value: JsonRpcResponse) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

let child: ChildProcess | null = null;
let restartCount = 0;
let nextId = 1;
const pending = new Map<number, PendingRequest>();
let initialized = false;

// --- Child process management ---

function spawnChild(): void {
  child = spawn('node', [GTD_MCP_PATH, '--project', PROJECT_DIR], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
  });

  const rl = createInterface({ input: child.stdout!, crlfDelay: Infinity });

  rl.on('line', (line: string) => {
    if (!line.trim()) return;
    try {
      const msg = JSON.parse(line) as JsonRpcResponse;
      if (msg.id !== undefined && pending.has(msg.id)) {
        const req = pending.get(msg.id)!;
        clearTimeout(req.timer);
        pending.delete(msg.id);
        req.resolve(msg);
      }
    } catch {
      // Not JSON — ignore (could be MCP server log output)
    }
  });

  child.stderr?.on('data', (data: Buffer) => {
    process.stderr.write(`[mcp-child] ${data}`);
  });

  child.on('exit', (code, signal) => {
    console.error(`[mcp-bridge] Child exited: code=${code} signal=${signal}`);
    initialized = false;

    // Reject all pending requests
    for (const [id, req] of pending) {
      clearTimeout(req.timer);
      req.reject(new Error(`MCP server exited (code=${code})`));
      pending.delete(id);
    }

    // Restart if under limit
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      console.error(`[mcp-bridge] Restarting child (attempt ${restartCount}/${MAX_RESTARTS})`);
      setTimeout(spawnChild, 1000);
    } else {
      console.error('[mcp-bridge] Max restarts reached, not restarting');
    }
  });

  // Initialize MCP connection
  sendInitialize();
}

async function sendInitialize(): Promise<void> {
  try {
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'gtd-mcp-bridge', version: '1.0.0' },
    });

    // Send initialized notification (no id)
    const notification = JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    });
    child?.stdin?.write(notification + '\n');

    initialized = true;
    restartCount = 0; // Reset on successful init
    console.error('[mcp-bridge] MCP server initialized');
  } catch (err) {
    console.error('[mcp-bridge] Failed to initialize MCP server:', err);
  }
}

// --- Local (non-proxied) workspace tools ---
//
// These tools live in the bridge, not in gtd-mcp-server.cjs. They give the
// host LLM filesystem + shell access scoped to /workspace so it can actually
// execute the GTD workflow (write PROJECT.md, run npx commands, etc.).

const LOCAL_TOOLS = [
  {
    name: 'fs_write',
    description:
      'Write (or overwrite) a file inside /workspace. Creates parent directories as needed. Paths are resolved relative to /workspace; absolute paths outside /workspace are rejected.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path, relative to /workspace (e.g. ".planning/PROJECT.md")' },
        content: { type: 'string', description: 'Full file contents (UTF-8).' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'fs_read',
    description:
      'Read a file inside /workspace. Returns UTF-8 contents. Size is capped at 1 MB — larger files are truncated.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path, relative to /workspace.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'fs_list',
    description:
      'List files and directories inside /workspace. Defaults to the workspace root and recursive=true (excluding node_modules, .git).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory to list, relative to /workspace. Default "".' },
        recursive: { type: 'boolean', description: 'Recurse into subdirectories. Default true.' },
      },
    },
  },
  {
    name: 'run_bash',
    description:
      'Run a shell command inside /workspace. Useful for scaffolding (npx create-expo-app), installing deps (npm install), running tests, etc. Timeout default is 600s (10 min) to accommodate scaffolding and installs. stdout and stderr are returned together, truncated at 16 KB. For very long-running work, split it across calls.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command to execute (run via `sh -c`).' },
        cwd: { type: 'string', description: 'Working directory, relative to /workspace. Default "".' },
        timeout_ms: { type: 'number', description: 'Timeout in milliseconds (max 120000).' },
      },
      required: ['command'],
    },
  },
] as const;

const LOCAL_TOOL_NAMES: Set<string> = new Set(LOCAL_TOOLS.map((t) => t.name));
const WORKSPACE_ROOT = PROJECT_DIR;
const MAX_READ_BYTES = 1_024 * 1_024; // 1 MB
const MAX_OUTPUT_BYTES = 16 * 1_024; // 16 KB
const MAX_BASH_TIMEOUT_MS = 600_000; // 10 min — enough for npx create-expo-app, npm install, etc.

function resolveWorkspacePath(rel: string): string {
  // Treat absolute paths as relative to workspace root to prevent escape.
  const cleaned = isAbsolute(rel) ? rel.replace(/^\/+/, '') : rel;
  const full = normalize(join(WORKSPACE_ROOT, cleaned));
  if (!full.startsWith(WORKSPACE_ROOT)) {
    throw new Error(`Path escapes workspace: ${rel}`);
  }
  return full;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n...[truncated, ${s.length - max} more bytes]`;
}

async function listFilesRecursive(dir: string, base: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    const rel = full.slice(base.length + 1);
    if (entry.isDirectory()) {
      out.push(rel + '/');
      const children = await listFilesRecursive(full, base);
      out.push(...children);
    } else {
      out.push(rel);
    }
  }
  return out;
}

interface McpToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

async function callLocalTool(name: string, args: Record<string, unknown>): Promise<McpToolResult> {
  try {
    switch (name) {
      case 'fs_write': {
        const path = String(args.path ?? '');
        const content = String(args.content ?? '');
        if (!path) throw new Error('path is required');
        const full = resolveWorkspacePath(path);
        await fs.mkdir(join(full, '..'), { recursive: true });
        await fs.writeFile(full, content, 'utf8');
        const bytes = Buffer.byteLength(content, 'utf8');
        return { content: [{ type: 'text', text: `Wrote ${bytes} bytes to ${path}` }] };
      }

      case 'fs_read': {
        const path = String(args.path ?? '');
        if (!path) throw new Error('path is required');
        const full = resolveWorkspacePath(path);
        const buf = await fs.readFile(full);
        const text = buf.subarray(0, MAX_READ_BYTES).toString('utf8');
        const suffix = buf.length > MAX_READ_BYTES ? `\n...[truncated, ${buf.length - MAX_READ_BYTES} more bytes]` : '';
        return { content: [{ type: 'text', text: text + suffix }] };
      }

      case 'fs_list': {
        const path = args.path ? String(args.path) : '';
        const recursive = args.recursive !== false;
        const full = resolveWorkspacePath(path);
        if (recursive) {
          const list = await listFilesRecursive(full, full);
          return { content: [{ type: 'text', text: list.join('\n') || '(empty)' }] };
        }
        const entries = await fs.readdir(full, { withFileTypes: true });
        const list = entries
          .filter((e) => e.name !== 'node_modules' && e.name !== '.git')
          .map((e) => (e.isDirectory() ? e.name + '/' : e.name));
        return { content: [{ type: 'text', text: list.join('\n') || '(empty)' }] };
      }

      case 'run_bash': {
        const command = String(args.command ?? '');
        if (!command) throw new Error('command is required');
        const cwdArg = args.cwd ? String(args.cwd) : '';
        const cwd = resolveWorkspacePath(cwdArg);
        const timeout = Math.min(
          Number(args.timeout_ms ?? MAX_BASH_TIMEOUT_MS),
          MAX_BASH_TIMEOUT_MS,
        );
        try {
          const { stdout, stderr } = await execFileAsync('sh', ['-c', command], {
            cwd,
            timeout,
            maxBuffer: MAX_OUTPUT_BYTES * 4,
            env: { ...process.env, CI: '1' },
          });
          const body =
            (stdout ? `stdout:\n${truncate(stdout, MAX_OUTPUT_BYTES)}` : '') +
            (stderr ? `\nstderr:\n${truncate(stderr, MAX_OUTPUT_BYTES)}` : '');
          return { content: [{ type: 'text', text: body || '(no output)' }] };
        } catch (err: unknown) {
          const e = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number | string };
          const body =
            `Exit: ${e.code ?? 'error'}\n` +
            (e.stdout ? `stdout:\n${truncate(e.stdout, MAX_OUTPUT_BYTES)}\n` : '') +
            (e.stderr ? `stderr:\n${truncate(e.stderr, MAX_OUTPUT_BYTES)}\n` : '') +
            (e.message ? `message: ${e.message}` : '');
          return { content: [{ type: 'text', text: body }], isError: true };
        }
      }

      default:
        return { content: [{ type: 'text', text: `Unknown local tool: ${name}` }], isError: true };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
  }
}

function sendRequest(method: string, params?: Record<string, unknown>): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    if (!child?.stdin?.writable) {
      return reject(new Error('MCP server not running'));
    }

    const id = nextId++;
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };

    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`MCP request timeout (${REQUEST_TIMEOUT_MS}ms)`));
    }, REQUEST_TIMEOUT_MS);

    pending.set(id, { resolve, reject, timer });

    child.stdin.write(JSON.stringify(request) + '\n');
  });
}

// --- HTTP server ---

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url ?? '';
  const method = req.method ?? '';

  // Health check
  if (url === '/mcp/health' && method === 'GET') {
    sendJson(res, 200, {
      alive: child !== null && !child.killed,
      initialized,
      pid: child?.pid,
      restartCount,
      pendingRequests: pending.size,
    });
    return;
  }

  // List tools
  if (url === '/mcp/tools/list' && method === 'POST') {
    if (!initialized) {
      sendJson(res, 503, { error: 'MCP server not initialized' });
      return;
    }

    try {
      const response = await sendRequest('tools/list', {});
      const result = (response.result ?? {}) as { tools?: unknown[] };
      const gtdTools = Array.isArray(result.tools) ? result.tools : [];
      // Merge GTD tools + local workspace tools
      sendJson(res, 200, { tools: [...gtdTools, ...LOCAL_TOOLS] });
    } catch (err: unknown) {
      sendJson(res, 500, { error: (err as Error).message });
    }
    return;
  }

  // Call tool
  if (url === '/mcp/tools/call' && method === 'POST') {
    if (!initialized) {
      sendJson(res, 503, { error: 'MCP server not initialized' });
      return;
    }

    try {
      const body = await readBody(req);
      const { name, arguments: args } = JSON.parse(body) as {
        name: string;
        arguments?: Record<string, unknown>;
      };

      if (!name) {
        sendJson(res, 400, { error: 'Missing tool name' });
        return;
      }

      // Intercept local tools — don't proxy to GTD stdio server
      if (LOCAL_TOOL_NAMES.has(name)) {
        const result = await callLocalTool(name, args ?? {});
        sendJson(res, 200, result);
        return;
      }

      const response = await sendRequest('tools/call', { name, arguments: args ?? {} });

      if (response.error) {
        sendJson(res, 422, { error: response.error });
      } else {
        sendJson(res, 200, response.result);
      }
    } catch (err: unknown) {
      sendJson(res, 500, { error: (err as Error).message });
    }
    return;
  }

  // Not found
  sendJson(res, 404, { error: 'Not found' });
}

// --- Start ---

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('[mcp-bridge] Unhandled error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Internal server error' });
    }
  });
});

spawnChild();

server.listen(PORT, '0.0.0.0', () => {
  console.error(`[mcp-bridge] Listening on 0.0.0.0:${PORT}`);
  console.error(`[mcp-bridge] GTD MCP: ${GTD_MCP_PATH}`);
  console.error(`[mcp-bridge] Project: ${PROJECT_DIR}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.error('[mcp-bridge] SIGTERM received, shutting down');
  child?.kill('SIGTERM');
  server.close();
  process.exit(0);
});
