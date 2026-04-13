# Git upgrade plan — prepare, flow, push, repo URL

> **Status:** Proposal (not implemented).  
> **Audience:** Maintainers and contributors planning a **new** Git lifecycle tool around GTD without destabilizing today’s workflows.

---

## 1. Executive summary (what we think)

**Idea:** Add a **dedicated tool** (and supporting workflow) that:

1. **Prepares Git** in the project directory (`git init` if needed, safe `.gitignore` suggestions, initial branch, optional user identity hints).
2. **Runs the usual GTD forward (or chosen) flow** unchanged — same agents, same `.planning/` contract, same phase semantics.
3. **Finishes with `git push`** (or documented equivalent) to a **remote** the user or CI configured.
4. **Returns** a stable **repository URL** (clone HTTPS/SSH + optional web UI link) for operators and end users.

**Recommendation:** **Yes, add a new workflow** (e.g. `ship-to-remote` or `git-publish`) that **orchestrates** existing steps plus **new** `lib/git-publish.cjs` (name TBD) logic. **Do not** fold this into every existing forward workflow by default — keeps risk low and makes the feature optional and testable.

**Separate workflow?** **Yes.** Reasons:

| Reason | Detail |
|--------|--------|
| **Side effects** | Remote creation, credentials, and `push` are irreversible in practice; they must not run implicitly during `/gtd-execute-phase` for everyone. |
| **Failure modes** | Network, 2FA, branch protection, and token expiry are **Git-host-specific**; isolating them avoids breaking core planning/execution. |
| **Testing** | E2E tests can mock a bare remote or use a disposable forge project without running the full forward pipeline twice. |
| **Permissions** | Some environments allow generation but forbid outbound `git push`; optional workflow respects that. |

Existing workflows (`execute-phase`, `deploy-local`, `ship`, etc.) stay as they are; the new path **calls into** them or reuses the same **`gtd-tools init <workflow>`** slices where appropriate.

---

## 2. Goals and non-goals

### 2.1 Goals

- One **clear entry point** (slash command + MCP tool + optional `gtd-tools` subcommand) for “**prepare Git → run GTD steps → push → print URLs**”.
- **Idempotent-ish “prepare”**: safe to re-run on a repo that already has `.git` (detect, optionally fetch, warn on dirty tree).
- **Explicit remote**: remote URL or forge API path supplied by env, config, or flags — no magic guessing of org/project beyond documented conventions.
- **Output contract**: machine-readable JSON (for CI) **and** human-readable summary (Markdown or stdout) including **clone URL** and **default branch**.

### 2.2 Non-goals (initial release)

- Replacing **GitHub** with **MinIO** as storage (see [VOLUME_USAGE.md](../VOLUME_USAGE.md) — Git remote stays a real forge).
- **Automatic PR** creation across forks (nice follow-up).
- **Multi-remote** fan-out (push to origin + mirror); start with **one** `origin`.

---

## 3. Proposed architecture

```
┌─────────────────────────────────────────────────────────────┐
│  NEW: workflow/forward/git-publish.md (thin orchestrator)    │
│  Documents: order of phases, env vars, failure handling      │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌───────────────────┐
│ lib/git-      │  │ Existing:      │  │ lib/git-publish   │
│ prep.cjs      │  │ init + forward │  │ (new): remote,    │
│ (new)         │  │ workflows      │  │ push, URL emit    │
└───────────────┘  └────────────────┘  └───────────────────┘
```

- **`git-prep`**: ensure repo, branch, ignore rules baseline, optional `user.name` / `user.email` from GTD config or env.
- **“Usual flow”**: invoke existing **plan/execute** boundaries (or a single “run through phase N” flag) — **no copy-paste** of agent markdown; reference current `workflows/forward/*.md` from the new workflow doc.
- **`git-publish`**: validate remote, `push -u`, capture returned URL from API if remote was **created** via API; else derive URL from `remote get-url origin`.

---

## 4. New surfaces (user-facing)

| Surface | Proposal |
|---------|----------|
| **Slash command** | `/gtd-git-publish` (or `/gtd-ship-remote`) — name bikeshed in implementation PR. |
| **MCP tool** | `gtd_git_publish` with structured args: `phase` optional, `remote_url`, `create_repo` boolean, `provider` enum. |
| **`gtd-tools`** | `node gtd-tools.cjs git publish [args]` delegating to `lib/git-publish.cjs`. |
| **Config** | Under `.planning/` or existing config schema: `git.remoteProvider`, `git.defaultBranch`, token **env var names only** (never store token in repo). |

---

## 5. Phased implementation plan

### Phase 0 — Design lock (this document + ADR)

- [ ] Confirm **workflow file name** and **command names** with maintainers.
- [ ] Add a short **ADR** (Architecture Decision Record) in `docs/plan/` or `docs/design/`: “Why separate workflow.”
- [ ] List supported **providers** for v1 (e.g. **GitHub REST** only, or **generic URL** only).

### Phase 1 — Git prep (local only, no network)

- [ ] New module `lib/git-prep.cjs`: `init` if no `.git`, default branch `main`, optional `.gitignore` merge for Node/common patterns.
- [ ] Wire `gtd-tools git prep` (dry-run flag).
- [ ] Unit tests with temp directories (no real remote).

### Phase 2 — Publish (push + URL)

- [ ] `lib/git-publish.cjs`: `git remote add` / `set-url`, `push`, parse **clone URL** from remote.
- [ ] Output **JSON** schema versioned (`schema_version`, `clone_url`, `html_url`, `branch`, `commit_sha`).
- [ ] Tests with **local bare repo** as `origin` (no GitHub required in CI).

### Phase 3 — Optional “create repo” API

- [ ] Behind flag `--create-remote`: call GitHub/GitLab API to create project, set `origin`, then push.
- [ ] Document required env: `GITHUB_TOKEN`, `GITLAB_TOKEN`, etc.
- [ ] **Never** log tokens; redact in error messages.

### Phase 4 — Workflow + agents

- [ ] Add `workflows/forward/git-publish.md` that lists: prep → (existing forward steps or pointer to phase) → publish.
- [ ] Add **installer** skill / command registration so slash command appears in supported runtimes.
- [ ] Update **USER-GUIDE** and **README** with one subsection + link to this plan when shipped.

### Phase 5 — MCP + SDK

- [ ] `gtd_git_publish` in `mcp/gtd-mcp-server.cjs` calling new `gtd-tools` commands.
- [ ] SDK method `publishToGit(options)` if desired (optional; can be Phase 5.1).

### Phase 6 — Hardening

- [ ] Dirty tree policy: `--allow-dirty` vs fail fast.
- [ ] Large file / LFS note in docs.
- [ ] Rate limits and retry for APIs.

---

## 6. Relationship to existing commands

| Existing | Relationship |
|----------|----------------|
| `/gtd-ship` (if present) | Clarify overlap: **ship** might mean PR locally; **git-publish** means **remote + URL**. Merge or differentiate in docs. |
| `/gtd-execute-phase` | **Unchanged**; git-publish may **call after** user-approved phases. |
| `gtd-tools` `init` | Reuse **context assembly** for “what to commit” (e.g. include `.planning/` in commit scope per config). |

---

## 7. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Leaked tokens | Env-only, CI secret store, document `GIT_TRACE` caution. |
| Force-push accidents | Default **no** `--force`; require explicit flag. |
| Wrong remote | Confirm URL interactively in interactive mode; in CI require exact `remote_url`. |
| Partial push | Post-push verify: `git ls-remote` vs local `HEAD`. |

---

## 8. Open questions

1. Should **first commit** include only generated source or **entire** tree including `.planning/`? (Default proposal: **configurable**, default **include** `.planning/` for GTD traceability.)
2. v1 **generic push-only** (user creates empty repo) vs **API create repo** first?
3. **Signing** commits (GPG/SSH sign) in scope for v1 or later?

---

## 9. Success criteria

- A junior can follow **USER-GUIDE** + **VOLUME_USAGE** + this plan’s Phase 1–2 and publish from a **Docker volume** workspace to a **test remote**.
- CI can run **push to bare repo** without cloud credentials.
- No regression in existing **1030+** tests (or current count); new tests added for git modules.

---

## 10. Related docs

- [VOLUME_USAGE.md](../VOLUME_USAGE.md) — Docker workspace before push.  
- [LOCAL_FORWARD_BACKWARD_PLAN.md](./LOCAL_FORWARD_BACKWARD_PLAN.md) — cloud orchestrator + tunnel + local GTD.  
- [CUSTOM-INTEGRATION-GUIDE.md](../CUSTOM-INTEGRATION-GUIDE.md) — orchestrators, MCP, SDK.  
- [BUILD-AND-PUBLISH.md](../BUILD-AND-PUBLISH.md) — release process for the npm package.

---

## 11. Summary

| Question | Answer |
|----------|--------|
| New tool? | **Yes** — `git prep` + `git publish` (or single `git publish` with `--prep`). |
| New workflow? | **Yes** — thin orchestrator markdown + optional new `WORKFLOW_CONTEXT` key in `lib/init.cjs` when needed. |
| Touch existing forward workflows? | **Minimal** — only **shared helpers** if duplication appears; default **no** change to `execute-phase.md` behavior. |
| Output | **Repo URL** (+ JSON for automation). |

When this plan is approved, create implementation issues per **Phase** above and link them from this file’s checklist.
