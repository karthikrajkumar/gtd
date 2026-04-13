# Docker volumes and project workspaces (junior-friendly guide)

This guide explains **where generated code should live** when you run **Get Things Done (GTD)** or a similar pipeline **inside Docker**. It is written for developers who are new to containers and volumes.

You will learn:

1. What a **Docker volume** is (in plain language).
2. The difference between a **named volume** and a **bind mount**.
3. Why a normal filesystem (volume) fits GTD better than **object storage** (e.g. MinIO) for day-to-day work.
4. How to wire a **project directory** so `git`, `gtd-tools`, and `.planning/` work as expected.
5. How **users** can get the code onto their own machine with **Git**.

---

## 1. The problem we are solving

You want to:

- Run an **orchestrator** or **GTD** in a **container** (repeatable environment).
- **Write** source files, `package.json`, `.planning/` docs, etc.
- Optionally run **`git init`**, commit, and **`git push`** to a company Git server (GitLab, GitHub, Gitea, …).
- Let **developers** open or clone that repo later (e.g. in VS Code, Cursor, or a **Monaco**-based web UI).

The container filesystem **by default disappears** when the container is removed. You need a **persistent place** that still looks like a normal folder to Linux tools.

That place is usually a **Docker volume** or a **bind mount**.

---

## 2. Tiny vocabulary (read once)

| Term | Meaning |
|------|--------|
| **Image** | Blueprint for a container (your `Dockerfile` build result). Read-only template. |
| **Container** | A running instance of an image. Has its own filesystem layer; changes can be lost when the container is deleted. |
| **Volume** | Storage **managed by Docker**, mounted into the container at a path (e.g. `/workspace`). Survives container removal (for **named volumes**). |
| **Bind mount** | A **specific folder on the host** (your laptop or server) mounted into the container (e.g. host `./my-app` → container `/workspace`). |
| **Working directory** | The folder where commands run (`WORKDIR` in Dockerfile, or `-w` in `docker run`). GTD expects a **project root** here. |

---

## 3. Why not use MinIO (or S3) as the main “project folder”?

**MinIO** (and AWS S3, Azure Blob, etc.) is **object storage**: you store **objects** (keys + blobs), not a full POSIX tree that every Linux tool understands.

| Need | Object store (MinIO / S3) | Docker volume / bind mount |
|------|---------------------------|----------------------------|
| `git init`, `git status`, normal commits | Awkward; not a real Git server on the bucket | Natural |
| Many small files, fast random edits | Possible via sync tools; not the primary design | Natural |
| **GTD** `gtd-tools`, `.planning/` Markdown | You would be fighting the model | Natural |

**Rule of thumb:** use **volumes or bind mounts** for the **live project tree** where GTD and Git run. Use **MinIO** (optional) for **artifacts**: release zips, backups, large binaries, reports—things you **upload** after the tree is ready.

---

## 4. Named volume vs bind mount (which should I use?)

### 4.1 Named volume

Docker stores the data in its own area. You refer to it by **name**.

**Good when:**

- You do not care about the exact host path.
- You want Docker to manage lifecycle and backups via `docker volume` commands.

**Example name:** `gtd-workspace-001`

### 4.2 Bind mount

You map **one host folder** into the container.

**Good when:**

- You want to **open the same folder** in your IDE on the host while the container runs.
- You want **easy backups** (“just copy this directory”).
- You debug and need to **see files immediately** on the host.

**Example host path:** `/home/dev/projects/my-generated-app` → container `/workspace`

---

## 5. Step-by-step: first run with a named volume

These steps assume you have **Docker installed** and a shell open.

### Step 1 — Create a named volume (once)

```bash
docker volume create gtd-demo-workspace
```

Check it exists:

```bash
docker volume ls | grep gtd-demo-workspace
```

### Step 2 — Run a container that mounts the volume

Example: run a generic Node 20 image, mount the volume at `/workspace`, and open a shell.

```bash
docker run --rm -it \
  -v gtd-demo-workspace:/workspace \
  -w /workspace \
  node:20-bookworm-slim \
  bash
```

Meaning:

- `-v gtd-demo-workspace:/workspace` — “Put the named volume **inside** the container at `/workspace`.”
- `-w /workspace` — “Use `/workspace` as the current directory.”

### Step 3 — Inside the container, treat `/workspace` as the project root

Inside the shell you just opened:

```bash
pwd
# should show /workspace

mkdir -p src
echo 'console.log("hello");' > src/index.js
git init
git config user.email "you@example.com"
git config user.name "GTD Demo"
git add .
git commit -m "chore: initial import"
```

You now have a **real Git repo** on the volume.

### Step 4 — Exit the container

Type `exit`. The container is removed (`--rm`), but the **volume** `gtd-demo-workspace` **keeps** the files.

### Step 5 — Confirm data survived

Run another container on the **same** volume:

```bash
docker run --rm -it \
  -v gtd-demo-workspace:/workspace \
  -w /workspace \
  node:20-bookworm-slim \
  bash -lc 'ls -la && git log --oneline -1'
```

You should still see `src/index.js` and your commit.

**Takeaway:** the volume is the **durable disk** for your generated app; the container is disposable.

---

## 6. Step-by-step: bind mount to a folder on your machine

### Step 1 — Create a host folder

```bash
mkdir -p ~/gtd-projects/demo-app
cd ~/gtd-projects/demo-app
git init
```

### Step 2 — Run the container with a bind mount

From anywhere (adjust the host path if needed):

```bash
docker run --rm -it \
  -v "$HOME/gtd-projects/demo-app:/workspace" \
  -w /workspace \
  node:20-bookworm-slim \
  bash
```

`$HOME/gtd-projects/demo-app` on the **host** is now visible as `/workspace` in the container.

### Step 3 — Generate or edit files

Anything you write under `/workspace` in the container appears **immediately** in `~/gtd-projects/demo-app` on the host. You can open that folder in **VS Code / Cursor** on the host without copying files.

**Takeaway:** bind mounts are ideal when **humans** want direct access to files on their machine.

---

## 7. Putting GTD in the picture

GTD expects a **project directory** (your repo root) where:

- Source code lives (`src/`, `app/`, …).
- **`.planning/`** holds GTD state and generated documents (when you use the backward pipeline or forward planning artifacts).

When GTD runs **inside Docker**:

1. Install or copy GTD into the image (or mount the package), **or** call `gtd-tools` from a mounted repo.
2. Set **`--project`** (for MCP) or **`cwd`** (for CLI) to the **mounted path** (e.g. `/workspace`).
3. Run your orchestrator / MCP client as designed; writes go to the volume or bind mount.

The **volume** is simply **that project directory** made persistent and visible to the container.

---

## 8. Optional: push to a real Git server

Object storage is **not** a Git server. For collaboration you still want a **remote** such as GitHub, GitLab, Gitea, Azure DevOps, etc.

Typical flow **inside** the container (conceptually):

1. `git remote add origin https://git.example.com/team/generated-demo.git`
2. `git push -u origin main`

Use **tokens or SSH keys** safely (Docker secrets, CI variables, short-lived credentials)—never commit secrets.

After push, **any user** can:

```bash
git clone https://git.example.com/team/generated-demo.git
cd generated-demo
```

They can then use **any editor** (including a **Monaco**-based web app that loads files from a **server-side clone** or from their local clone).

---

## 9. docker-compose example (one service, one volume)

Save as `docker-compose.yml` next to your project (adapt image and commands):

```yaml
services:
  gtd-runner:
    image: node:20-bookworm-slim
    working_dir: /workspace
    volumes:
      - gtd_workspace:/workspace
    # Example: keep a shell open; replace with your real command
    command: sleep infinity

volumes:
  gtd_workspace:
```

Start:

```bash
docker compose up -d
docker compose exec gtd-runner bash
```

You are now in `/workspace` backed by the named volume `gtd_workspace`.

To use a **bind mount** instead, replace the `volumes` block with:

```yaml
    volumes:
      - ./my-app:/workspace
```

Create `./my-app` on the host first (`mkdir -p my-app`).

---

## 10. Permissions (when files look “owned by root”)

On Linux, files created in a container are often owned by **root** (uid 0) unless you set a user.

**Junior-friendly fix ideas:**

- Run the container as your user id:  
  `docker run --user "$(id -u):$(id -g)" ...`  
  (May need extra flags or writable home for some tools—test in your environment.)
- Or fix ownership on the host after generation:  
  `sudo chown -R "$USER:$USER" ./my-app`  
  (Use carefully; understand why you need it.)

If something fails with “permission denied,” ask: **which user is the process using, and who owns the mounted folder?**

---

## 11. Cleaning up

**Remove a container** (often does **not** delete named volumes):

```bash
docker rm -f <container_name>
```

**Remove a named volume** (deletes data permanently):

```bash
docker volume rm gtd-demo-workspace
```

**Bind mount:** delete files on the host folder, or `rm -rf` that folder (careful).

---

## 12. Checklist before you call it “done”

- [ ] Project path in the container is **one** clear root (e.g. `/workspace`).
- [ ] GTD / MCP uses **`--project`** (or equivalent) pointing at that path.
- [ ] You chose **named volume** (portable) vs **bind mount** (easy host access) on purpose.
- [ ] **Git remote** points to a real forge, not an S3 URL, if you need `git clone` for humans.
- [ ] **Secrets** for `git push` are injected safely, not baked into the image.
- [ ] You have a **backup** story for important volumes (snapshots, export, push to remote).

---

## 13. Where to read next

- **[README.md](../README.md)** — install, MCP, cloud vs local context.
- **[CUSTOM-INTEGRATION-GUIDE.md](./CUSTOM-INTEGRATION-GUIDE.md)** — SDK, MCP, custom orchestrators, Monaco-style apps.

---

## 14. One-sentence summary

**Store generated code on a Docker volume or bind mount so Git and GTD see a normal folder; use a real Git server for collaboration; use object storage only when you need blobs or artifacts—not as your primary editable workspace.**
