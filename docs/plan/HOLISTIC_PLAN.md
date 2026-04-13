# Holistic plan — sandbox workspaces, GTD execution, and Git handover

> **Status:** Architecture blueprint (implementation is product-specific).  
> **Audience:** Platform engineers building an **orchestrator + isolated workspaces** product that uses **Get Things Done (GTD)** tooling, then **hands ownership to GitHub**.

This document merges: **control plane vs execution plane**, **Docker vs Firecracker sandboxes**, a **stable sandbox API**, **GTD in the workspace**, and **Git handover** into one coherent loop.

---

## Table of contents

- [1. Design split: control plane vs execution plane](#1-design-split-control-plane-vs-execution-plane)
- [2. Sandbox lifecycle (runtime-agnostic)](#2-sandbox-lifecycle-runtime-agnostic)
- [3. Docker sandbox path (v1 recommendation)](#3-docker-sandbox-path-v1-recommendation)
- [4. Firecracker microVM path (upgrade)](#4-firecracker-microvm-path-upgrade)
- [5. Sandbox service API (abstraction)](#5-sandbox-service-api-abstraction)
- [6. GTD in the workspace](#6-gtd-in-the-workspace)
- [7. Git handover](#7-git-handover)
- [8. Recommended practical architecture](#8-recommended-practical-architecture)
- [9. Related plans and docs](#9-related-plans-and-docs)

---

## 1. Design split: control plane vs execution plane

### 1.1 Control plane (your product)

This is everything that **does not** run user or agent code at full trust:

| Concern | Examples |
|---------|----------|
| **API** | REST/GraphQL for projects, workspaces, sessions |
| **Orchestrator** | LLM routing, tool routing, workflow state |
| **Auth / billing** | Users, orgs, quotas, API keys |
| **Project metadata** | IDs, names, template, linkage to GitHub |
| **GitHub linkage** | OAuth, GitHub App installation, token references |

**Rule:** Keep the control plane **unable** to directly mutate workspace files except through a **narrow sandbox API**.

### 1.2 Execution plane (sandboxes)

Where **code is written, built, tested, and previewed**:

| Option | Role |
|--------|------|
| **Docker** | One container per workspace; fast to ship; good default for v1. |
| **Firecracker** | MicroVM per workspace; stronger isolation; higher ops cost. |

**Rule:** Sandboxes must be **isolated** from your main application runtime. Docker security guidance emphasizes **non-privileged users**, **no `--privileged`**, and optional **AppArmor / SELinux**. Firecracker is a **minimal KVM-based VMM** with a smaller device surface than a general-purpose VM — suited to **multi-tenant arbitrary code** when you outgrow container-only threat models.

---

## 2. Sandbox lifecycle (runtime-agnostic)

The lifecycle is the same for Docker or Firecracker:

| Step | Name | What happens |
|------|------|----------------|
| 1 | **Create project** | Orchestrator creates a **project** record in your DB. |
| 2 | **Create workspace** | A **workspace** is a runtime instance tied to a project (and optionally a branch). |
| 3 | **Prepare filesystem** | **Clone** an existing repo **or** **unpack** a starter template into the workspace root. |
| 4 | **Attach runtime metadata** | Persist: `workspace_id`, `project_id`, `runtime_type`, repo URL, branch, commit SHA, **preview URL**, **status**. |
| 5 | **Run commands** | Coding layer performs file I/O and shell commands **inside** the sandbox. |
| 6 | **Preview** | Sandbox runs dev server or static preview; platform exposes URL (ingress, reverse proxy, or tunnel). |
| 7 | **Handover** | On acceptance, state is **pushed to GitHub** (see [§7](#7-git-handover)). |
| 8 | **Shutdown** | Stop preview, stop VM/container, **delete or hibernate**; optionally retain volume snapshot; **keep DB metadata**. |

That is the **core platform loop**.

---

## 3. Docker sandbox path (v1 recommendation)

Docker is the **simplest** path to production for most teams: familiar tooling, fast iteration, straightforward Git and Node/Python inside the guest.

### 3.1 What a Docker sandbox is

Typically:

- **One container** per workspace  
- **One mounted workspace volume** (per-workspace Docker volume is the easiest model)  
- **Isolated network namespace**  
- **CPU / memory** cgroup limits  
- **Non-root user** inside the container  
- **Limited** capability set and **restricted** mounts  
- **Minimal** syscalls surface where feasible  

Inside the container: project files, language runtimes, package managers, build/test tools, and optionally a **preview server**.

### 3.2 Creation flow (step-by-step)

**Step 1 — Receive workspace request**

Orchestrator (or API) receives something like:

- `project_id`  
- `template_id` **or** `repo_url`  
- `runtime_image` (curated base)  
- CPU / memory limits  
- Env vars (non-secret references; secrets injected at runtime)  
- Network policy (egress allowlist / deny-by-default)  

**Step 2 — Choose a base image**

Curated images, for example:

- Node workspace image  
- Python workspace image  
- Full-stack (Node + tooling) image  
- **Polyglot agent image** that already includes **GTD** (`get-things-done` npm package, `gtd-tools`, optional MCP bridge)

**Step 3 — Create isolated storage**

Writable project tree, usually one of:

- Ephemeral upper layer + named **volume** for `/workspace` (recommended)  
- Bind mount to dedicated host path (single-tenant / dev)  
- Network filesystem (shared worker pool)  
- Object store sync **plus** local temp volume (less ideal for live `git`; see [VOLUME_USAGE.md](../VOLUME_USAGE.md))

**Step 4 — Start the container**

Apply:

- CPU / memory quotas  
- **No** privileged mode  
- Non-root user  
- Minimal Linux capabilities  
- Read-only root where possible + writable `/workspace` only  
- Sandbox egress rules (egress proxy or firewall)  

**Step 5 — Initialize project contents**

Then either:

- `git clone <url> /workspace`, or  
- Copy starter template into `/workspace`  

The **coding layer** (agents, GTD, IDE sync) uses file and shell tools against `/workspace`.

**Step 6 — Start preview (optional)**

Examples: `npm run dev`, `vite`, `next dev`, `python -m http.server`.  
For external access: internal ingress, reverse proxy, or **Cloudflare Tunnel** (`cloudflared` outbound to Cloudflare — see Cloudflare’s tunnel docs for token-based remotely managed tunnels).

**Step 7 — Stream telemetry**

Control plane receives:

- stdout / stderr  
- command exit codes  
- preview health checks  
- file change events (optional watcher)  

**Step 8 — Suspend or destroy**

Stop preview → stop container → remove container → optionally remove volume → **retain metadata** in DB.

### 3.3 Strengths and risks

| Strengths | Risks |
|-----------|--------|
| Fast to ship, easy debug, great fit for Git + previews + GTD | Weaker boundary than a VM for **untrusted** arbitrary code |
| Ecosystem and docs (including AI workload patterns) | Host/kernel CVE class — plan upgrades and hardening |

**Practical note:** Docker’s ecosystem is moving toward **stronger isolation** for agent workloads (including microVM-backed options). Your **sandbox API** should let you swap the backend later.

---

## 4. Firecracker microVM path (upgrade)

### 4.1 What a Firecracker sandbox is

- **One microVM** per workspace  
- Guest **kernel** + **rootfs** (e.g. ext4 image)  
- vCPU / memory assignment  
- Guest networking + often a **small in-guest agent**  

You are **booting a VM**, not only namespacing a process.

### 4.2 Creation flow (summary)

1. Same **workspace request** as Docker.  
2. **Select guest artifacts:** uncompressed kernel + rootfs (per Firecracker getting-started expectations).  
3. **Prepare rootfs:** base image, copy-on-write overlay per workspace, inject bootstrap agent.  
4. **Create microVM** via Firecracker’s **host-side HTTP API** (configure kernel, rootfs, drives, net, boot source).  
5. **Boot guest**; agent clones template / repo, runs commands, reports status, starts preview.  
6. **Preview / network path** — internal proxy or tunnel.  
7. **Persist metadata** — `microvm_id`, image version, endpoints, state.  
8. **Destroy or snapshot** guest; archive overlay; retain DB row.

### 4.3 Tradeoff

| Firecracker strengths | Costs |
|------------------------|--------|
| Better **security boundary** for multi-tenant arbitrary code | Kernel + rootfs lifecycle, networking, file ingress/egress |
| Small attack surface, fast boot (project claims ~ms-scale boot class) | Harder debugging than `docker exec` |

**Guideline:** **Docker for v1**; **Firecracker** when threat model or compliance requires it — **same sandbox API**, different driver.

---

## 5. Sandbox service API (abstraction)

The control plane should **not** care whether the backend is Docker or Firecracker. Expose a **stable internal API**, for example:

| Operation | Purpose |
|-----------|---------|
| `create_workspace` | Allocate runtime + volume + network |
| `destroy_workspace` | Tear down |
| `hibernate_workspace` | Stop CPU; optionally keep disk |
| `clone_repo` | Git clone into workspace root |
| `init_template` | Materialize starter tree |
| `read_file` / `write_file` / `apply_patch` | Agent or orchestrator file ops |
| `run_command` | Shell with timeout and output capture |
| `start_preview` / `stop_preview` | Dev server lifecycle |
| `get_logs` / `get_status` | Observability |

**GTD** maps naturally to **`run_command`** (invoke `gtd-tools`) and/or **stdio MCP spawned in the sandbox** with `--project /workspace` — see next section.

---

## 6. GTD in the workspace

| Approach | How |
|----------|-----|
| **CLI** | Install `@karthikrajkumar.kannan/get-things-done` in the image; run `node .../gtd-tools.cjs ...` with `cwd=/workspace`. |
| **MCP** | Run `gtd-mcp-server.cjs --project /workspace` **inside** the sandbox; orchestrator connects via **localhost** or a sidecar — no tunnel required for **cloud-hosted** sandboxes. |
| **Forward / backward** | Same as today: agents + workflows read/write under `/workspace` and `.planning/`. |

**Handover note:** Decide whether `.planning/` is included in the Git push (recommended default for traceability; configurable). Aligns with [GIT_UPGRADE_PLAN.md](./GIT_UPGRADE_PLAN.md).

---

## 7. Git handover

This is the **most important product boundary**: after acceptance, **GitHub** (or your enterprise Git) becomes the **system of record**, not the sandbox disk.

### 7.1 Handover state machine (recommended)

| State | Meaning |
|-------|---------|
| `SANDBOX_ACTIVE` | Normal editing / generation |
| `READY_FOR_HANDOVER` | User or policy triggered “finish” |
| `HANDOVER_IN_PROGRESS` | Push / PR in flight |
| `HANDED_OVER` | Remote has canonical tree + metadata stored |
| `ARCHIVED` | Workspace torn down; repo remains |

### 7.2 Preconditions — connect GitHub

- User completes **OAuth** or **GitHub App** installation.  
- Store **installation id** or token **reference** (not raw tokens in DB if avoidable); map to org/user.

### 7.3 Handover modes

| Mode | Use case |
|------|----------|
| **A — New repo** | Greenfield scaffold |
| **B — New branch on existing repo** | Controlled updates |
| **C — Open PR** | Team review before merge |

### 7.4 Flow (step-by-step)

1. **Freeze** workspace: stop concurrent mutations; optional final build/test.  
2. **Git state:** `git init` if needed; else `fetch`; create branch from agreed base.  
3. **Commit:** stage accepted files; structured message (e.g. `feat: scaffold from workspace ws_abc`).  
4. **Push** to `main` (new repo) or feature branch.  
5. **PR:** If mode C, create PR via [GitHub REST API](https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#create-a-pull-request); body lists summary, env vars user must set, manual steps.  
6. **Record:** `repo_url`, `branch`, `commit_sha`, `pr_url`, `handed_over_at`.  
7. **Shutdown workspace** (or hibernate); optional short-lived preview; **reopen** later by cloning from GitHub.

### 7.5 Implementation options

| Option | When to use |
|--------|-------------|
| **Git CLI inside sandbox** (or trusted handover worker) | **Default** — full history, normal workflows, large trees |
| **GitHub Contents API** (file-by-file base64) | Small patches, automation helpers; **not** primary for whole-repo handover |

Use REST API heavily for **repo create**, **branch protection queries**, **PR open**, **checks** — and **Git** for the tree.

---

## 8. Recommended practical architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  CONTROL PLANE                                               │
│  API · Orchestrator · Auth · Billing · DB · GitHub App/OAuth │
└───────────────────────────┬─────────────────────────────────┘
                            │ sandbox API only
┌───────────────────────────▼─────────────────────────────────┐
│  EXECUTION PLANE (v1: Docker per workspace)                    │
│  · curated image + GTD + runtimes                              │
│  · /workspace on Docker volume                                 │
│  · non-root · limits · network policy                          │
│  · preview + logs                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │ on acceptance
┌───────────────────────────▼─────────────────────────────────┐
│  GIT HANDOVER                                                  │
│  freeze → commit → push (Git CLI) → optional PR → metadata     │
└───────────────────────────────────────────────────────────────┘
```

**Upgrade path:** swap execution driver to **Firecracker** for selected tenants; **keep sandbox API + Git handover** unchanged.

---

## 9. Related plans and docs

| Doc | Role |
|-----|------|
| [GIT_UPGRADE_PLAN.md](./GIT_UPGRADE_PLAN.md) | First-party `git prep` / `git publish` tooling inside GTD package (optional complement to platform handover). |
| [LOCAL_FORWARD_BACKWARD_PLAN.md](./LOCAL_FORWARD_BACKWARD_PLAN.md) | When the **runtime** is the user’s laptop (tunnel + local MCP), not a cloud sandbox. |
| [VOLUME_USAGE.md](../VOLUME_USAGE.md) | Docker volumes and bind mounts for `/workspace`. |
| [CUSTOM-INTEGRATION-GUIDE.md](../CUSTOM-INTEGRATION-GUIDE.md) | MCP, SDK, custom orchestrators. |

---

## 10. One-paragraph summary

**Split** control plane and execution plane; run **one workspace per sandbox** (Docker first) with a **writable volume**, **curated image** including **GTD**, **strict isolation** and **preview**; stream logs to the control plane; on success run a **Git handover** so **GitHub owns the code**; then **destroy or hibernate** the sandbox. Expose a **stable sandbox API** so you can later **upgrade** high-risk tenants to **Firecracker** without rewriting orchestration or Git flows.
