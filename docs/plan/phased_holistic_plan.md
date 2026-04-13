# Phased holistic delivery plan

> **Parent doc:** [HOLISTIC_PLAN.md](./HOLISTIC_PLAN.md) — architecture and vocabulary.  
> **This doc:** ordered **phases**, **acceptance criteria** as checklists, and **phase-complete** gates. Mark items `[x]` when done (keep `[ ]` until verified).

**How to use**

- Complete phases **in order** unless a note says “parallel OK.”  
- A phase is **done** only when **every** acceptance box for that phase is checked.  
- Record **date + owner** in your issue tracker; this file stays the high-level contract.
- **Pattern B (MCP in sandbox + LiteLLM):** [Orchestrator, LiteLLM, and sandbox MCP](#orchestrator-litellm-and-sandbox-mcp-pattern-b).

---

## Phase 0 — Foundations and sign-off

**Goal:** Everyone agrees on boundaries, states, and threats before code spreads.

### Deliverables

- Architecture diagram (control plane ↔ sandbox API ↔ execution plane) reviewed.
- Workspace **state machine** agreed: `SANDBOX_ACTIVE` → `READY_FOR_HANDOVER` → `HANDOVER_IN_PROGRESS` → `HANDED_OVER` → `ARCHIVED` (see HOLISTIC §7.1).
- Threat model documented: who runs arbitrary code, data residency, secret handling.
- Decision: **Docker-only** for execution v1; Firecracker deferred to Phase 9.

### Acceptance criteria (phase complete)

- Stakeholders signed off (written OK in wiki/ADR or ticket).
- [HOLISTIC_PLAN.md](./HOLISTIC_PLAN.md) linked from your internal README or runbook.

---

## Phase 1 — Control plane skeleton

**Goal:** Persist projects and workspaces; no untrusted code execution yet.

### Deliverables

- Database (or equivalent) with **projects** and **workspaces** tables / collections.
- Authenticated **API** to create/list/archive **projects**.
- Authenticated **API** to create workspace record in `pending` / `provisioning` state.
- Service identity: control plane can call sandbox service with **mTLS** or signed JWT (pick one, document it).

### Acceptance criteria

- Create project + workspace via API returns stable IDs; no Docker required for this phase.
- Unauthorized requests rejected (401/403).
- Audit log entry for project/workspace creation (minimal: actor, id, timestamp).

---

## Phase 2 — Sandbox service MVP (Docker)

**Goal:** One **isolated** workspace container per workspace record; **no** Git handover yet.

### Deliverables

- **Sandbox worker** implements `create_workspace` → starts container with:
  - Dedicated **named volume** mounted at `/workspace`
  - **Non-root** user inside container
  - **CPU + memory** limits
  - **No** `--privileged`
  - **Minimal** Linux capabilities (document which caps are dropped)
- `destroy_workspace` removes container and optionally volume.
- `run_command` executes in container with **timeout**, returns **exit code + stdout/stderr** (capped size).
- Workspace status transitions: `provisioning` → `SANDBOX_ACTIVE` → `stopped` on destroy.

### Acceptance criteria

- From control plane, create → `run_command` (e.g. `echo ok` / `uname -a`) → destroy succeeds end-to-end.
- Two workspaces on same host **cannot** read each other’s volume paths (smoke test).
- OOM or timeout surfaces as structured error to control plane (no silent hang).

---

## Phase 3 — Filesystem prep in sandbox

**Goal:** Materialize a real tree under `/workspace` (clone or template).

### Deliverables

- `clone_repo` — clone allowed URL into `/workspace` (allowlist or signed URLs).
- `init_template` — unpack curated template by `template_id`.
- `read_file` / `write_file` — path confined under `/workspace` (reject `..` / absolute escape).
- Optional: `apply_patch` — unified diff or structured patch with same path rules.

### Acceptance criteria

- Clone **public** test repo; `read_file` returns expected file content.
- `write_file` then `git diff` (via `run_command`) shows change.
- Malicious path strings rejected with clear error (automated test).

---

## Phase 4 — Preview and observability

**Goal:** User-visible preview URL + logs for the control plane UI.

### Deliverables

- `start_preview` / `stop_preview` — long-lived process managed (supervisor or PID file in sandbox).
- **Preview URL** stored on workspace row (ingress, reverse proxy, or tunnel — document which).
- `get_logs` — tail recent stdout/stderr for preview and/or last N commands.
- `get_status` — aggregates: container up?, preview health?, last command exit?.
- Health check: HTTP GET to preview returns **2xx** when ready (or documented alternative).

### Acceptance criteria

- For a minimal static or Vite template, preview URL loads in browser after `start_preview`.
- `stop_preview` frees port; restart idempotent.
- Control plane UI or API can show **live status** without SSH to worker host.

---

## Phase 5 — GTD inside the workspace

**Goal:** Install and run **Get Things Done** against `/workspace` from the sandbox.

### Deliverables

- Curated **workspace image** includes `@karthikrajkumar.kannan/get-things-done` (or pinned path to `gtd-tools.cjs`).
- `run_command` (or documented script) runs `gtd-tools` / `init scan-codebase` with `cwd=/workspace`.
- Optional: **MCP** — `gtd-mcp-server.cjs --project /workspace` on localhost inside container; orchestrator in **sidecar** or same network namespace (document one approach).
- Policy: include **`.planning/`** in Git handover default = **documented** (yes/no configurable later in Phase 7).
- **Pattern B:** implement **one** LiteLLM integration option from [§ Orchestrator, LiteLLM, and sandbox MCP](#orchestrator-litellm-and-sandbox-mcp-pattern-b) (A, B, or C); document session **teardown**.

### Acceptance criteria

- After scan-related flow, `.planning/` or documented outputs exist under `/workspace` (per GTD behavior).
- At least one **backward** path smoke test (e.g. scan + one doc generation if your product enables it) passes in CI using a disposable workspace.
- Image rebuild is versioned (tag) and referenced from workspace metadata.
- **Session teardown smoke test:** end session → sandbox destroyed **and** LiteLLM MCP registration / virtual key removed or invalidated (per chosen option); replaying old credentials does not reach a live MCP.

---

## Orchestrator, LiteLLM, and sandbox MCP (Pattern B)

This section fixes a common gap: **exposing GTD as tools does not by itself run them in the sandbox.** The handler must terminate **inside** the workspace (or call a sandbox API that does).

### B.1 What the workspace image includes

For Pattern B, bake (or mount read-only) into the **workspace image**:

- Node + your stack  
- `@karthikrajkumar.kannan/get-things-done` so `gtd-tools.cjs` and `mcp/gtd-mcp-server.cjs` exist  
- A small **HTTP MCP bridge** in front of **stdio** MCP if your gateway expects streamable HTTP / SSE (LiteLLM’s typical path)

Inside the container:

- GTD uses **`--project /workspace`** (or equivalent `cwd`).  
- MCP listens on **`127.0.0.1:<port>`** (or a Unix socket); only your **gateway / sidecar** exposes it to the platform network.

**Rule:** **one sandbox = one GTD install + one MCP endpoint for that workspace.**

### B.2 Where tool calls execute

| Wrong mental model | Right mental model |
| ------------------ | ------------------ |
| “LiteLLM is configured once; all `gtd_*` calls hit one global MCP on the API server.” | Each **workspace session** routes MCP `tools/call` to the **URL** (or proxy) that terminates **in that container**. |
| “The LLM SSHs into Docker.” | The **orchestrator / LiteLLM** sends normal **MCP JSON-RPC** to your **per-workspace** MCP URL (through auth). |

Stock `gtd-mcp-server.cjs` uses **stdio**; the process that hosts it must have **`cwd` = `/workspace`**. Pattern B usually means: **stdio MCP inside the container + HTTP adapter** for external callers.

### B.3 LiteLLM: scope MCP to **this session only**

LiteLLM manages **registered MCP servers** and **access by virtual key / team / access groups** (see [LiteLLM MCP](https://docs.litellm.ai/docs/mcp) and [MCP permission management](https://docs.litellm.ai/docs/mcp_control)). Pick **one** of these patterns:

#### Option A — Ephemeral virtual key + single MCP server (good for “this chat only”)

1. On session start: register an MCP server in LiteLLM’s store, e.g. alias `ws_<workspaceId>` → URL `https://your-gateway/sandboxes/<id>/mcp` (with static or rotating auth headers).  
2. Create a **virtual key** whose MCP allowlist is **only** that server (or one access group containing only that server).  
3. The chat client uses **that key** for all completion / `/v1/responses` calls for the session.  
4. On session end: **revoke/delete** the virtual key, **delete/disable** the MCP server row, **destroy** sandbox and gateway route.

#### Option B — Header-based server selection (fewer DB rows per session)

LiteLLM supports selecting MCP servers via headers such as **`x-mcp-servers`** (comma-separated aliases). Your orchestrator sends **only** the workspace server alias on every request for that chat; after session end, **stop** sending it and **destroy** the sandbox so the URL fails closed.

#### Option C — Tools **outside** LiteLLM (simplest for high-churn workspaces)

LiteLLM handles **LLM** traffic only. Your **orchestrator** merges tool definitions, and on each `tool_use` calls the workspace MCP (or `run_command`) **directly**. No per-session MCP registration in LiteLLM; teardown is “stop proxying + destroy sandbox.”

### B.4 Session teardown checklist (must all be true)

| Layer | Action |
| ----- | ------ |
| **Runtime** | Stop container; delete or retain volume per policy. |
| **Network** | Remove ingress / tunnel path to that workspace MCP URL. |
| **LiteLLM** (if A or B) | Remove MCP server registration **or** detach from key / access group; revoke ephemeral key. |
| **Auth** | Invalidate workspace-scoped tokens so replay fails. |

If the sandbox is destroyed but LiteLLM still lists a dead MCP server, users get noisy errors — **unregister explicitly**.

### B.5 Phase mapping

| Phase | What to implement |
| ----- | ----------------- |
| **4–5** | Gateway URL to workspace MCP; GTD in image; choose Option A, B, or C and document it. |
| **5** | Acceptance includes **teardown** test (see Phase 5 acceptance criteria above). |
| **7–8** | Handover and archive; ensure teardown runs on **timeout** and **user logout** as well as happy path. |

---

## Phase 6 — GitHub connection (pre-handover)

**Goal:** User can link GitHub safely; tokens not stored in plaintext in app logs.

### Deliverables

- **GitHub OAuth** or **GitHub App** installation flow from UI.
- Store **installation id** / token **reference** (vault, KMS, or provider secret — document).
- UI shows **connected orgs/users** and missing permissions clearly.

### Acceptance criteria

- Test user can connect and disconnect without orphan tokens in DB.
- Token never appears in application logs or client-side bundle.
- Documented **least-privilege** scopes for your handover modes (Phase 7).

---

## Phase 7 — Git handover (Mode A: new repo)

**Goal:** Freeze workspace → commit → push to **new** GitHub repo → record URLs → tear down sandbox.

### Deliverables

- State transitions: `READY_FOR_HANDOVER` → `HANDOVER_IN_PROGRESS` → `HANDED_OVER`.
- **Freeze** — block new mutations during handover (queue or reject commands).
- **Git CLI** path: `git init` if needed, `git add`, `git commit`, `git remote`, `git push` (or worker with same effect).
- **GitHub REST**: create empty repo (or use `gh` with PAT from vault) before first push — document.
- Persist: `repo_url`, `branch`, `commit_sha`, `handed_over_at`.
- `destroy_workspace` (or hibernate) after successful handover per product policy.

### Acceptance criteria

- Greenfield template → handover → `git clone` on a fresh machine reproduces project (including agreed `.planning/` policy).
- Failed push rolls back to `READY_FOR_HANDOVER` or `SANDBOX_ACTIVE` with actionable error (no stuck `HANDOVER_IN_PROGRESS`).
- Idempotent guard: second handover attempt does not create duplicate repos without explicit user action.

---

## Phase 8 — Handover modes B/C, hibernation, product hardening

**Goal:** Team workflows + operational maturity.

### Deliverables

- **Mode B:** push to **new branch** on existing repo.
- **Mode C:** open **pull request** via GitHub API; PR body template includes env vars and manual steps.
- `hibernate_workspace` / resume (if in scope): stop compute, keep volume; document TTL.
- Per-user or per-org **quotas** (max concurrent workspaces, CPU, disk).
- Billing hooks or usage meters (even if stub) aligned with quotas.

### Acceptance criteria

- Mode C: reviewer can merge PR in GitHub; resulting `main` matches intended tree.
- Hibernate + resume passes smoke test without data loss (checksum sample files).
- Quota exceeded returns **429** with clear message to UI.

---

## Phase 9 (optional) — Firecracker execution driver

**Goal:** Same **sandbox API**; swap Docker implementation for microVM driver for selected tenants.

### Deliverables

- Firecracker lifecycle behind existing operations (`create_workspace`, etc.).
- Guest image pipeline documented (kernel + rootfs versioning).
- Feature flag or plan tier: “execution = firecracker”.

### Acceptance criteria

- At least one **E2E** test suite passes against Firecracker backend with no control-plane API changes.
- Security review sign-off compared to Docker path.

---

## Progress tracker (phases)

Mark the **phase** when all its acceptance boxes are done.


| Phase | Title                     | Status |
| ----- | ------------------------- | ------ |
| 0     | Foundations and sign-off  | [ ]    |
| 1     | Control plane skeleton    | [ ]    |
| 2     | Sandbox MVP (Docker)      | [ ]    |
| 3     | Filesystem prep           | [ ]    |
| 4     | Preview and observability | [ ]    |
| 5     | GTD in workspace          | [ ]    |
| 6     | GitHub connection         | [ ]    |
| 7     | Git handover Mode A       | [ ]    |
| 8     | Modes B/C + hardening     | [ ]    |
| 9     | Firecracker (optional)    | [ ]    |


---

## Related documents


| Document                                                           | Use                                            |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| [HOLISTIC_PLAN.md](./HOLISTIC_PLAN.md)                             | Full architecture narrative                    |
| [GIT_UPGRADE_PLAN.md](./GIT_UPGRADE_PLAN.md)                       | Optional GTD-first-party `git publish` tooling |
| [LOCAL_FORWARD_BACKWARD_PLAN.md](./LOCAL_FORWARD_BACKWARD_PLAN.md) | Laptop + tunnel instead of cloud sandbox       |
| [VOLUME_USAGE.md](../VOLUME_USAGE.md)                              | Docker volumes for `/workspace`                |


