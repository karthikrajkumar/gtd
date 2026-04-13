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
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

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
      sendJson(res, 200, response.result ?? response.error ?? response);
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
