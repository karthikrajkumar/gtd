<div align="center">

# GET THINGS DONE

**The first bidirectional spec-driven agentic framework for AI-assisted development.**

**Forward.** Take an idea, research it, plan it, generate code, deploy it, test it.
**Backward.** Take existing code, analyze it deeply, generate 7 types of technical documents.
**In Sync.** Detect when specs and code drift apart. Reconcile automatically.

[![npm version](https://img.shields.io/npm/v/@karthikrajkumar.kannan/get-things-done?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@karthikrajkumar.kannan/get-things-done)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-1030%20passing-brightgreen?style=for-the-badge)](tests/)
[![Agents](https://img.shields.io/badge/agents-33-purple?style=for-the-badge)]()
[![Commands](https://img.shields.io/badge/commands-40-orange?style=for-the-badge)]()

<br>

```bash
npx @karthikrajkumar.kannan/get-things-done@latest
```

**Works with Claude Code, Gemini CLI, OpenCode, Codex, Copilot, Cursor, Windsurf, Augment, and Cline.**

**Also available as an MCP server** -- use GTD tools from Python, TypeScript, Go, Rust, or any language.

**Home page:** [https://github.com/karthikrajkumar/gtd](https://github.com/karthikrajkumar/gtd)  
**Repository:** [https://github.com/karthikrajkumar/gtd](https://github.com/karthikrajkumar/gtd)

</div>

---

## Table of Contents

- [Why Get Things Done?](#why-get-things-done)
- [Quick Start](#quick-start)
- [The Three Modes](#the-three-modes)
- [What Makes GTD Different](#what-makes-gtd-different)
- [Installation](#installation)
- [MCP Server -- Use GTD as Tools from Any Language](#mcp-server----use-gtd-as-tools-from-any-language)
- [Cloud-hosted code and local access](#cloud-hosted-code-and-local-access)
- [Docker project workspace and volumes](#docker-project-workspace-and-volumes)
- [Local forward and backward (plan)](#local-forward-and-backward-plan)
- [SDK for CI/CD](#sdk-for-cicd)
- [Architecture](#architecture)
- [Document Formats](#document-formats)
- [Scale-Adaptive Intelligence](#scale-adaptive-intelligence)
- [Complete Command Reference](#complete-command-reference)
- [Configuration](#configuration)
- [License](#license)

---

## Why Get Things Done?

Every AI coding tool today goes in **one direction**:

- **GSD, BMAD, SpecKit** take specs and generate code (forward only)
- **JSDoc, Swagger, Mintlify** take code and generate basic docs (backward only, limited)
- **Nothing** keeps specs and code in sync after changes

GTD is the first framework that does **all three**:

```
FORWARD >>>     Idea -> Research -> Spec -> Plan -> Code -> Deploy -> Test -> Verify
BACKWARD <<<    Code -> Scan -> Analyze -> Draft -> Verify -> Finalize (7 doc types)
SYNC <><>       Detect Drift -> Show Differences -> Reconcile -> Stay Aligned
```

One framework. One `.planning/` directory. One install. Both directions. Always in sync.

---

## Quick Start

### Step 1: Install

```bash
npx @karthikrajkumar.kannan/get-things-done@latest
```

The installer will ask you:
1. **Which runtime?** -- Claude Code, Cursor, Gemini CLI, Copilot, etc. (multi-select supported)
2. **Global or local?** -- Global installs for all projects, local for current project only

### Step 2: Open your project in your AI coding tool

```bash
cd /path/to/your/project
cursor .    # or claude, or your preferred tool
```

### Step 3: Start using GTD commands in the AI chat

```
/gtd-help                    # See all available commands

# Document existing code (backward)
/gtd-scan                    # Map your codebase
/gtd-create-tdd              # Generate a Technical Design Document
/gtd-create-all              # Generate all 7 document types

# Build from an idea (forward)
/gtd-new-project             # Start from an idea
/gtd-plan-phase 1            # Research + create execution plan
/gtd-execute-phase 1         # Generate code with atomic commits
/gtd-deploy-local            # Deploy and test locally

# Keep everything aligned (sync)
/gtd-drift                   # Detect spec <-> code drift
/gtd-sync                    # Auto-reconcile
```

> **Note:** These are slash commands typed in your AI tool's chat panel, not in the terminal.

---

## The Three Modes

### Backward Mode: Code to Documents

**Already have code? Generate professional technical documentation in minutes.**

The backward pipeline reads your entire codebase, performs deep analysis across 7 dimensions, and produces structured, accuracy-verified documents.

#### How It Works

```
/gtd-scan
  |
  +-- Scans all files (respects .gitignore)
  +-- Detects languages: TypeScript, Python, Go, Rust, Java, Ruby, etc.
  +-- Fingerprints frameworks: Next.js, Express, FastAPI, Django, Spring, etc.
  +-- Identifies entry points, module boundaries, infrastructure
  +-- Output: .planning/CODEBASE-MAP.md

/gtd-analyze
  |
  +-- 7 parallel analyzer agents examine your code:
  |   +-- Architecture Analyzer -- patterns, layers, components, communication
  |   +-- API Extractor -- endpoints, schemas, auth, errors
  |   +-- Pattern Detector -- design patterns, conventions, anti-patterns
  |   +-- Data Flow Tracer -- request lifecycle, events, transformations
  |   +-- Dependency Analyzer -- deps graph, versions, build toolchain
  |   +-- Security Scanner -- auth, encryption, validation, vulnerabilities
  |   +-- Performance Profiler -- caching, bottlenecks, scaling config
  +-- Output: .planning/analysis/ (7 analysis artifacts)

/gtd-create-tdd (or any document type)
  |
  +-- Writer agent reads analysis + template
  +-- Generates structured document with Mermaid diagrams
  +-- Accuracy verifier cross-checks every claim against actual code
  +-- Presents draft with verification score for your review
  +-- Output: .planning/documents/TDD.md
```

#### 7 Document Types

| Command | Document | What It Contains |
|---------|----------|-----------------|
| `/gtd-create-tdd` | Technical Design Document | Architecture, components, data model, APIs, dependencies, testing |
| `/gtd-create-hld` | High-Level Design | System overview, subsystems, data flow, integrations, deployment |
| `/gtd-create-lld` | Low-Level Design | Module specs, function signatures, algorithms, query patterns |
| `/gtd-create-capacity` | Capacity Plan | Resource requirements, scaling strategy, bottleneck analysis |
| `/gtd-create-sysdesign` | System Design | End-to-end architecture, security, reliability, observability |
| `/gtd-create-api-docs` | API Documentation | Every endpoint, request/response schemas, auth, error codes |
| `/gtd-create-runbook` | Operations Runbook | Deployment procedures, monitoring, incident response, troubleshooting |
| `/gtd-create-all` | **All 7 documents** | Generates the complete suite in wave-based order |

Every document is **accuracy-verified** against your actual code before you see it. The verifier checks file paths, code snippets, dependency versions, API endpoints, and architectural claims. No hallucination.

---

### Forward Mode: Idea to Deploy

**Describe what you want. GTD builds it.**

```
/gtd-new-project "A REST API for managing invoices"
  +-- Adaptive questioning (understands your vision)
  +-- 4 parallel research agents (stack, features, architecture, pitfalls)
  +-- Requirements extraction (v1 must-have, v2 future, out of scope)
  +-- Phased roadmap generation
  +-- Output: PROJECT.md, REQUIREMENTS.md, ROADMAP.md

/gtd-plan-phase 1
  +-- 4 parallel phase researchers investigate implementation approaches
  +-- Planner creates detailed task list with dependencies
  +-- Plan-checker verifies quality (up to 3 revision cycles)
  +-- Output: PLAN files with wave-grouped tasks

/gtd-execute-phase 1
  +-- Groups tasks into waves (independent tasks run in parallel)
  +-- Executor agent writes code, runs tests, commits atomically per task
  +-- Integration checkpoint between waves
  +-- Output: Committed code + SUMMARY.md

/gtd-deploy-local
  +-- Auto-detects: Docker Compose, Dockerfile, npm start, Python/uvicorn, Go, Rust
  +-- Builds project, starts services, health check polling
  +-- Output: DEPLOY-REPORT.md

/gtd-test-phase 1
  +-- Auto-detects: Vitest, Jest, pytest, Go test, Cargo test, RSpec
  +-- Runs tests, collects coverage, maps failures to plan tasks
  +-- Output: TEST-REPORT.md

/gtd-ship --pr
  +-- Creates a PR with structured description linking to requirements
```

**Autonomous mode:** `/gtd-autonomous 1 --to 5` runs phases 1 through 5 unattended.

---

### Sync Mode: Drift Detection

**After building, specs and code inevitably drift apart. GTD catches it.**

No other framework does this. This is GTD's killer differentiator.

```
/gtd-drift
  +-- Compares REQUIREMENTS.md against actual code
  +-- Compares generated documents against actual code
  +-- Categorizes: ADDITION, REMOVAL, MUTATION, STRUCTURAL
  +-- Scores: CRITICAL, MAJOR, MINOR, INFO
  +-- Output: DRIFT-REPORT.md

  Example: "Found 3 drift items:
    MAJOR:  New /api/admin endpoint not in spec
    MINOR:  Auth uses session instead of JWT
    INFO:   Added rate limiting (improvement)"

/gtd-sync --auto
  +-- Detect drift -> Reconcile -> Apply
  +-- Strategies: code-wins (update specs), spec-wins (fix code), interactive
  +-- Output: Everything back in sync

/gtd-audit
  +-- Coverage matrix: Requirements -> Code: 94%, -> Docs: 87%, -> Tests: 72%
  +-- Gap analysis with remediation priorities
  +-- Output: AUDIT-REPORT.md
```

---

## What Makes GTD Different

| Feature | GSD | BMAD | Auto-Doc Tools | **GTD** |
|---------|-----|------|---------------|---------|
| Forward (spec to code) | Yes | Yes | No | **Yes** |
| Backward (code to docs) | No | No | Basic only | **7 document types** |
| Bidirectional sync | No | No | No | **Yes (drift detection)** |
| Document accuracy verification | No | No | No | **Cross-checks against code** |
| Local deploy + test | No | No | No | **Auto-detect + health check** |
| Drift detection | No | No | No | **4 categories + severity** |
| Compliance formats | No | No | No | **SOC 2, ISO 27001, HIPAA** |
| MCP server | No | No | No | **19 tools via stdio** |
| Scale-adaptive | No | Yes | No | **5 tiers (micro to enterprise)** |
| Runtime support | 12 | 2 | N/A | **9 runtimes + MCP** |

---

## Installation

### Interactive Install

```bash
npx @karthikrajkumar.kannan/get-things-done@latest
```

### Non-Interactive Install

```bash
# Single runtime
npx @karthikrajkumar.kannan/get-things-done@latest --cursor --local
npx @karthikrajkumar.kannan/get-things-done@latest --claude --global

# Multiple runtimes
npx @karthikrajkumar.kannan/get-things-done@latest --cursor --claude --global

# All runtimes
npx @karthikrajkumar.kannan/get-things-done@latest --all --local
```

| Flag | Runtime | Install Path (global) |
|------|---------|----------------------|
| `--claude` | Claude Code | `~/.claude/` |
| `--cursor` | Cursor | `~/.cursor/` |
| `--gemini` | Gemini CLI | `~/.gemini/` |
| `--opencode` | OpenCode | `~/.config/opencode/` |
| `--codex` | Codex | `~/.codex/` |
| `--copilot` | GitHub Copilot | `~/.github/` |
| `--windsurf` | Windsurf | `~/.codeium/windsurf/` |
| `--augment` | Augment | `~/.augment/` |
| `--cline` | Cline | `~/.cline/` |

### Cursor Setup

```bash
cd /path/to/your/project
npx @karthikrajkumar.kannan/get-things-done@latest --cursor --local
```

Creates `.cursor/skills/gtd-*/SKILL.md` (40 skills). Open project in Cursor, type `/gtd-help`.

### Claude Code Setup

```bash
npx @karthikrajkumar.kannan/get-things-done@latest --claude --global
```

Auto-discovered by Claude Code. Type `/gtd-help` in any project.

---

## MCP Server -- Use GTD as Tools from Any Language

### What is MCP?

**MCP (Model Context Protocol)** is an open standard that lets AI applications connect to tool providers. Think of it as "USB for AI tools" -- any MCP client can use any MCP server, regardless of programming language.

GTD ships with a built-in MCP server using **stdio transport**:
- **No HTTP server** to deploy
- **No ports** to configure
- **No cloud** -- runs entirely local as a subprocess
- **Any language** can connect: Python, TypeScript, Go, Rust, Java, etc.

### 19 Tools Available

| Tool | Description | Category |
|------|-------------|----------|
| `gtd_scan` | Scan and map codebase (languages, frameworks, entry points, infrastructure) | Backward |
| `gtd_analyze` | Deep code analysis across 7 dimensions | Backward |
| `gtd_create_document` | Generate a specific document (tdd, hld, lld, capacity, system-design, api-docs, runbook) | Backward |
| `gtd_create_all` | Generate the complete 7-document suite | Backward |
| `gtd_verify_docs` | Verify document accuracy against actual code | Backward |
| `gtd_update_docs` | Incrementally update documents (changed sections only) | Backward |
| `gtd_new_project` | Initialize from idea (questioning, research, requirements, roadmap) | Forward |
| `gtd_plan_phase` | Research + create verified execution plan | Forward |
| `gtd_execute_phase` | Execute phase plans (generate code, test, commit) | Forward |
| `gtd_deploy_local` | Deploy locally (auto-detects Docker, npm, Python, Go, Rust) | Forward |
| `gtd_test` | Run test suite (auto-detects 6 frameworks) | Forward |
| `gtd_drift` | Detect spec-code drift (4 categories + severity scoring) | Sync |
| `gtd_sync` | Auto-reconcile drift (code-wins, spec-wins, interactive) | Sync |
| `gtd_audit` | Full alignment audit (requirements to code to docs to tests) | Sync |
| `gtd_status` | Pipeline status (forward + backward + sync) | Utility |
| `gtd_config` | Get or set configuration values | Utility |
| `gtd_read_document` | Read a generated document or planning artifact | Utility |
| `gtd_list_documents` | List all documents with status | Utility |
| `gtd_scale_detect` | Detect project tier and adaptive config | Utility |

### How the MCP Server Works

```
+----------------------------------------------+
|  YOUR APPLICATION                             |
|  (Python, TypeScript, Go, Rust,               |
|   React app, CLI tool, CI pipeline,           |
|   Claude Desktop, or any MCP client)          |
+---------------------+------------------------+
                      |
                      |  stdin/stdout (JSON-RPC)
                      |  No network. No ports.
                      |
+---------------------v------------------------+
|  GTD MCP SERVER                               |
|  (Node.js subprocess)                         |
|                                               |
|  19 tools: scan, analyze, create, verify,     |
|  drift, sync, audit, status, config, ...      |
|                                               |
|  Reads/writes: .planning/ directory           |
|  Reads: source code (your project)            |
+-----------------------------------------------+
```

Your app spawns `gtd-mcp-server.cjs` as a child process. Communication is stdin/stdout JSON-RPC. The server lives only as long as your subprocess -- no cleanup needed.

### Setup: Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "gtd": {
      "command": "node",
      "args": [
        "/absolute/path/to/node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs",
        "--project",
        "/absolute/path/to/your/project"
      ]
    }
  }
}
```

Restart Claude Desktop. GTD tools appear in the tools menu. Claude can now scan, generate docs, detect drift through natural conversation.

### Setup: Claude Code

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

### Usage: Python

```bash
pip install mcp
```

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import asyncio

async def main():
    server_params = StdioServerParameters(
        command="node",
        args=[
            "node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs",
            "--project", "/path/to/your/project"
        ],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # List all 19 tools
            tools = await session.list_tools()
            print(f"GTD tools: {len(tools.tools)}")

            # Scan codebase
            result = await session.call_tool("gtd_scan", arguments={})
            print(result.content[0].text)

            # Generate TDD
            result = await session.call_tool("gtd_create_document", arguments={
                "doc_type": "tdd", "format": "standard"
            })
            print(result.content[0].text)

            # Check drift
            result = await session.call_tool("gtd_drift", arguments={})
            print(result.content[0].text)

asyncio.run(main())
```

### Usage: TypeScript / Node.js

```bash
npm install @modelcontextprotocol/sdk
```

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: [
    'node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs',
    '--project', '/path/to/project'
  ],
});

const client = new Client({ name: 'my-app', version: '1.0.0' }, {});
await client.connect(transport);

const { tools } = await client.listTools();   // 19 tools
const result = await client.callTool({ name: 'gtd_scan', arguments: {} });
console.log(result.content[0].text);
```

### Usage: Custom Chat Application

For a React + Monaco Editor + Chat app with your own orchestrator:

```typescript
// Backend: connect to GTD once at startup
const transport = new StdioClientTransport({
  command: 'node',
  args: ['node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs',
         '--project', projectDir],
});
const gtdClient = new Client({ name: 'my-ide', version: '1.0.0' }, {});
await gtdClient.connect(transport);

// Route /gtd-* commands from your chat to MCP tool calls
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (message.startsWith('/gtd-')) {
    const toolName = message.slice(1).split(' ')[0].replace(/-/g, '_');
    const result = await gtdClient.callTool({ name: toolName, arguments: {} });
    return res.json({ response: result.content[0].text });
  }
  // Normal chat -> forward to Claude/OpenAI
});
```

### Usage: Claude API with Tool Use

Pass GTD tools directly to the Claude API:

```python
import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def chat_with_gtd():
    server_params = StdioServerParameters(
        command="node",
        args=["./node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs",
              "--project", "."],
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            # Convert MCP tools to Claude format
            mcp_tools = await session.list_tools()
            claude_tools = [
                {"name": t.name, "description": t.description, "input_schema": t.inputSchema}
                for t in mcp_tools.tools
            ]

            # Claude decides which GTD tools to call
            client = anthropic.Anthropic()
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=4096,
                tools=claude_tools,
                messages=[{"role": "user",
                           "content": "Scan this codebase and generate a TDD"}],
            )

            # Execute tool calls
            for block in response.content:
                if block.type == "tool_use":
                    result = await session.call_tool(block.name, arguments=block.input)
                    print(f"{block.name}: {result.content[0].text[:300]}")
```

### Usage: OpenAI API with Function Calling

Same pattern, different format:

```python
import openai
# ... connect to MCP same as above ...

# Convert to OpenAI format
openai_tools = [
    {"type": "function", "function": {"name": t.name, "description": t.description, "parameters": t.inputSchema}}
    for t in mcp_tools.tools
]

response = openai.chat.completions.create(
    model="gpt-4o", tools=openai_tools,
    messages=[{"role": "user", "content": "Analyze this project"}],
)
```

### Quick Test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node node_modules/@karthikrajkumar.kannan/get-things-done/mcp/gtd-mcp-server.cjs
```

You should see two JSON responses: server info + list of 19 tools.

---

## Cloud-hosted code and local access

GTD runs against a **project directory on the machine** where you use slash commands, the MCP server (`--project`), or the SDK. If the source of truth lives in the cloud, use one of these patterns to get (and keep) that tree locally.

### 1. Git

Code lives in **GitHub, GitLab, Azure DevOps, Bitbucket**, or another Git host. Locally: `git clone`, then `git pull` / `git fetch` for updates; use branches and remotes as usual.

**When to use:** Default for ongoing development when the repo is the artifact.

### 2. Remote development

**VS Code Remote-SSH**, **JetBrains Gateway**, **GitHub Codespaces** (browser or VS Code), **cloud workstations**, etc. The canonical tree may stay in the cloud while your editor connects over SSH or a vendor tunnel; some setups also mirror files to disk.

**When to use:** You want a powerful or standardized environment without maintaining it on the laptop.

### 3. Download / export

**Release zips**, **CI artifacts**, **container images** with source, or **object storage** (S3, Azure Blob) with folder download.

**When to use:** One-off copies, releases, or generated drops rather than daily edit loops.

### 4. Sync clients

Cloud folders synced to a local directory (Dropbox-style). Possible for files; **risky for active Git repos** (conflicts, corrupted `.git`) unless the team standardizes carefully.

**When to use:** Non-Git assets or small teams with clear rules; usually prefer Git instead.

### 5. Private network access

Source on a **VM or file share** in a VPC: **VPN**, **ExpressRoute** / private link, **bastion + scp/rsync**, or **SMB/NFS mounts** so your machine sees the path.

**When to use:** Enterprise code that never leaves a private boundary except over approved network paths.

### 6. API or internal portal

Internal “download project” APIs, **package registries** (npm, PyPI, NuGet, Artifactory), or portals that ship **libraries / SDKs** rather than a full app repo.

**When to use:** Consuming versioned packages; partial source compared to a full monorepo clone.

### Summary

| Need | Typical approach |
|------|------------------|
| Full project, day-to-day | **Git** clone + pull/push |
| Edit on a managed remote machine | **Remote dev** / cloud IDE |
| Snapshot or release | **Download** / artifact / image |
| Code only inside corporate cloud | **VPN** + Git or **rsync/SSH** |
| Consume binaries or APIs | **Registry** / internal **API** |

For embedding GTD in your own app (SDK, MCP, prompts), see **[docs/CUSTOM-INTEGRATION-GUIDE.md](docs/CUSTOM-INTEGRATION-GUIDE.md)**.

---

## Docker project workspace and volumes

When GTD or your orchestrator runs **inside Docker**, keep the repo on a **named volume** or **bind mount** so `git`, `gtd-tools`, and `.planning/` behave like a normal project tree. Object stores (e.g. MinIO) are better for **artifacts**, not as the primary editable workspace.

**Step-by-step guide:** [docs/VOLUME_USAGE.md](docs/VOLUME_USAGE.md)

---

## Local forward and backward plan

If the **orchestrator** (and LiteLLM or similar) runs in the **cloud** while code and `.planning/` must stay on the **developer’s machine**, use a **tunnel** and a **local MCP bridge** so tool calls reach **`gtd-mcp-server`** with a local `--project`. Covers forward (writes), backward (reads + docs), security, and delivery phases.

**Full plan:** [docs/plan/LOCAL_FORWARD_BACKWARD_PLAN.md](docs/plan/LOCAL_FORWARD_BACKWARD_PLAN.md)

---

## SDK for CI/CD

```bash
npm install @karthikrajkumar.kannan/get-things-done-sdk
```

```typescript
import { GTD } from '@karthikrajkumar.kannan/get-things-done-sdk';

const gtd = new GTD({ projectDir: '.', autoMode: true, format: 'enterprise' });
const staleness = await gtd.checkStaleness();
if (staleness.staleDocuments.length > 0) {
  await gtd.updateAll();
}
```

See `sdk/examples/` for GitHub Actions and GitLab CI templates.

---

## Architecture

### 33 Specialized Agents

| Category | Count | Agents |
|----------|-------|--------|
| **Forward: Research** | 3 | project-researcher (x4), phase-researcher (x4), research-synthesizer |
| **Forward: Planning** | 3 | roadmapper, planner, plan-checker |
| **Forward: Execution** | 4 | executor, verifier, code-reviewer, debugger |
| **Forward: Deploy/Test** | 2 | deployer, test-runner |
| **Backward: Discovery** | 1 | codebase-mapper |
| **Backward: Analysis** | 7 | architecture, api, patterns, data-flow, dependencies, security, performance |
| **Backward: Writing** | 8 | tdd, hld, lld, capacity, sysdesign, api-docs, runbook writers + diagram generator |
| **Backward: Verification** | 2 | accuracy-verifier, completeness-auditor |
| **Sync** | 3 | drift-detector, reconciliation-planner, alignment-auditor |

### Fresh Context Per Agent

Every agent spawns with a clean context window. No context rot.

### File-Based State

All state in `.planning/` as human-readable Markdown. Git-committable. Survives session resets.

---

## Document Formats

| Format | Sections | Best For |
|--------|----------|----------|
| `standard` | 10 | Engineering teams |
| `enterprise` | 15 | Architecture review boards |
| `startup` | 7 | Small teams, MVPs |
| `compliance` | 18 | SOC 2, ISO 27001, HIPAA audits |

```
/gtd-create-tdd --format compliance
```

---

## Scale-Adaptive Intelligence

| Tier | Files | Analysis | Documents |
|------|-------|----------|-----------|
| **Micro** | 1-5 | Shallow, 1 agent | Single combined document |
| **Small** | 5-50 | Standard, 4 agents | Standard 7-document set |
| **Medium** | 50-500 | Standard, 6 agents | Full suite with cross-references |
| **Large** | 500-5K | Deep, 7 agents | Per-domain documents with index |
| **Enterprise** | 5K+ | Deep, 7 agents | Service-level docs + integration maps |

---

## Complete Command Reference

### Backward (15) | Forward (16) | Sync (4) | Utility (5)

**Backward:** `/gtd-scan` `/gtd-analyze` `/gtd-create-tdd` `/gtd-create-hld` `/gtd-create-lld` `/gtd-create-capacity` `/gtd-create-sysdesign` `/gtd-create-api-docs` `/gtd-create-runbook` `/gtd-create-all` `/gtd-verify-docs` `/gtd-review-docs` `/gtd-update-docs` `/gtd-diff` `/gtd-doc-status`

**Forward:** `/gtd-new-project` `/gtd-discuss-phase` `/gtd-plan-phase` `/gtd-execute-phase` `/gtd-verify-work` `/gtd-deploy-local` `/gtd-test-phase` `/gtd-ship` `/gtd-next` `/gtd-autonomous` `/gtd-quick` `/gtd-fast` `/gtd-debug` `/gtd-code-review` `/gtd-add-phase` `/gtd-progress`

**Sync:** `/gtd-drift` `/gtd-reconcile` `/gtd-sync` `/gtd-audit`

**Utility:** `/gtd-help` `/gtd-status` `/gtd-settings` `/gtd-health` `/gtd-map-codebase`

---

## Configuration

```
/gtd-settings documents.format enterprise
/gtd-settings models.analyzer opus
```

| Setting | Default | Options |
|---------|---------|---------|
| `documents.format` | `standard` | `standard`, `enterprise`, `startup`, `compliance` |
| `models.analyzer` | `sonnet` | `sonnet`, `opus`, `haiku` |
| `models.writer` | `sonnet` | `sonnet`, `opus`, `haiku` |
| `analysis.depth` | `standard` | `shallow`, `standard`, `deep` |
| `workflow.parallelization` | `true` | `true`, `false` |
| `planning.granularity` | `standard` | `coarse`, `standard`, `fine` |

---

## License

MIT License. See [LICENSE](LICENSE).

---

<div align="center">

**Get Things Done.** Forward. Backward. In Sync.

*33 agents. 40 commands. 19 MCP tools. 1,030 tests. One framework.*

</div>
