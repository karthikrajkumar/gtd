# Running the GTD Orchestrator Platform

This doc covers how to bring up the three-tier stack locally and how to
keep the sandbox Docker image in sync with your code changes.

- **orchestrator/** — Sandbox service (Fastify, port `3000`). Spawns Docker
  containers, proxies GTD MCP tools over HTTP.
- **gtd-orchestrator/server/** — Test orchestrator server (Fastify + WS,
  port `4000`). Talks to Gemini, routes tool calls to the sandbox service,
  streams events to the UI over WebSocket.
- **gtd-orchestrator/ui/** — React + Vite UI (port `5173`). Chat pane +
  Monaco editor + file explorer.

```
 Browser (5173)
      │
      ▼
 gtd-orchestrator/server (4000)  ── HTTP ──▶  orchestrator (3000)
      │                                             │
      │                                             ▼
      └──── WebSocket ──▶ UI                   Docker sandbox
                                               (workspace image,
                                                MCP bridge on :3100
                                                inside each container)
```

---

## Prerequisites

- **Docker or OrbStack** (this repo is set up for OrbStack on macOS, see
  `orchestrator/.env` for the socket path).
- **Node.js 20+**.
- **A Gemini API key** — https://aistudio.google.com/apikey

Quick sanity checks:

```bash
docker info        # must print client/server info, not "Cannot connect"
node --version     # v20.x.x or higher
```

---

## One-time setup

Do these once after cloning or after a `git pull` that touches `package.json`
or the Dockerfile.

### 1. Install dependencies (three projects)

```bash
# Sandbox service
cd orchestrator && npm install

# Test orchestrator server
cd ../gtd-orchestrator/server && npm install

# UI
cd ../ui && npm install
```

### 2. Create `.env` files

**`orchestrator/.env`** (already in repo on your machine, but if missing):
```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# OrbStack on macOS — adjust to /var/run/docker.sock if using Docker Desktop
DOCKER_SOCKET=/Users/YOU/.orbstack/run/docker.sock
WORKSPACE_IMAGE=gtd-workspace:latest
SANDBOX_CPU_LIMIT=1
SANDBOX_MEMORY_LIMIT=1g

MCP_BRIDGE_PORT=3100
MCP_BRIDGE_TIMEOUT_MS=65000
```

**`gtd-orchestrator/server/.env`**:
```env
GEMINI_API_KEY=your-gemini-api-key
PORT=4000
SANDBOX_SERVICE_URL=http://localhost:3000
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_TOKENS=8192
MCP_TOOL_TIMEOUT_MS=605000
NODE_ENV=development
```

The `.env` is git-ignored. Don't commit your key.

### 3. Build the sandbox Docker image

This image is what every user session runs inside. Each sandbox is a
container based on it.

```bash
cd orchestrator
docker build -f docker/workspace.Dockerfile -t gtd-workspace:latest .
```

This takes ~30–60s the first time. Subsequent rebuilds are mostly cached
(under 5s if only the bridge changed).

Verify:
```bash
docker images gtd-workspace:latest
# Should list one row with a recent created time.
```

---

## Daily startup (three terminals)

Open three terminals. Order matters — the UI and the orchestrator server
will fail fast if the sandbox service isn't up first.

### Terminal 1 — Sandbox service

```bash
cd orchestrator
npm run dev
```

**Expected:** `GTD Sandbox Service listening on 0.0.0.0:3000`.

### Terminal 2 — Test orchestrator server

```bash
cd gtd-orchestrator/server
npm run dev
```

**Expected:**
```
GTD Test Orchestrator running on 0.0.0.0:4000
Sandbox service: http://localhost:3000
Gemini model: gemini-2.5-flash
```

### Terminal 3 — UI

```bash
cd gtd-orchestrator/ui
npm run dev
```

**Expected:** `Local:   http://localhost:5173/`. Open that URL.

### Smoke test

Before interacting in the UI:
```bash
curl http://localhost:3000/health       # sandbox service
curl http://localhost:4000/api/health   # orchestrator server
```
Both should return `{"status":"ok",...}`.

---

## Keeping the Docker image fresh

**You need to rebuild `gtd-workspace:latest` whenever any of these change:**

- `orchestrator/docker/workspace.Dockerfile`
- `orchestrator/docker/entrypoint.sh`
- `orchestrator/src/mcp/mcp-bridge.ts` — this is copied into the image
  and runs inside every sandbox.

If you don't rebuild, existing sandboxes run the old bridge. New sandboxes
created after the rebuild will have the new bridge automatically.

**Rebuild command:**
```bash
cd orchestrator
docker build -f docker/workspace.Dockerfile -t gtd-workspace:latest .
```

**Pick up the new image** in a running session:
1. In the UI, click **Destroy** on the current session, then **New Sandbox**.
2. Or via CLI: `docker rm -f $(docker ps -q --filter "name=gtd-sandbox-")`
   and create a new session from the UI.

The sandbox service doesn't need a restart — only the containers it spawns.

---

## Common issues

### `connect ENOENT /var/run/docker.sock`
Your `DOCKER_SOCKET` in `orchestrator/.env` is wrong for your setup.
- **OrbStack:** `/Users/YOU/.orbstack/run/docker.sock`
- **Docker Desktop:** `/var/run/docker.sock`

Restart Terminal 1 after fixing.

### "Session not found" in the UI after saving code
The orchestrator server uses an in-memory session store. When `tsx watch`
reloads after a source edit, that store is wiped — but the Docker
container is still running orphaned.

Fix:
1. Click **Destroy** in the UI (may 404; that's fine).
2. Remove orphaned containers: `docker rm -f $(docker ps -aq --filter "name=gtd-sandbox-")`.
3. Click **New Sandbox**.

### Tool call hangs for 2–5 minutes
Expected for `npx create-expo-app` / `npm install` inside a fresh sandbox.
Timeouts are:
- `run_bash`: 600s (10 min) — inside bridge
- `MCP_TOOL_TIMEOUT_MS`: 605s — orchestrator → bridge fetch

If it takes longer than 10 min, bump both.

### `.planning/` files don't appear in the explorer
The file tree is pushed via WebSocket on every file-modifying tool call.
If it's stuck empty, force a nudge: ask Gemini "list the workspace files"
— it'll call `fs_list`, which will refresh the tree.

### Gemini writes only a few files then stops with "please stand by"
Covered by the auto-nudge in `agent-loop.ts`. If it still happens:
1. Tell Gemini "continue writing the remaining files."
2. If chronic, raise `MAX_AUTO_NUDGES` from 3 in
   `gtd-orchestrator/server/src/agent/agent-loop.ts`.

---

## Stopping / teardown

Three Ctrl+C's — one per terminal — plus cleanup of any stray sandboxes.

```bash
# Kill any running sandbox containers
docker ps -q --filter "name=gtd-sandbox-" | xargs -r docker rm -f

# Optional: nuke all stopped ones too
docker container prune -f
```

The `gtd-workspace:latest` image itself is fine to keep around. Remove
only if you want to force a clean rebuild:
```bash
docker rmi gtd-workspace:latest
```

---

## Quick reference

| What you changed | What to restart |
|---|---|
| UI (`gtd-orchestrator/ui/src/**`) | Nothing — Vite HMR handles it |
| Orchestrator server (`gtd-orchestrator/server/src/**`) | Nothing — tsx watch reloads; destroy + new sandbox in UI |
| Sandbox service (`orchestrator/src/**` except `mcp-bridge.ts`) | Nothing — tsx watch; existing sandboxes keep running |
| `orchestrator/src/mcp/mcp-bridge.ts` | Rebuild image + destroy + new sandbox |
| `orchestrator/docker/*` | Rebuild image + destroy + new sandbox |
| `package.json` in any project | `npm install` in that project + restart its server |
| `.env` in any project | Restart that server (tsx watch does NOT re-read `.env`) |
