#!/bin/bash
set -e

# Optional: clone a repo if GTD_CLONE_URL is set
if [ -n "$GTD_CLONE_URL" ]; then
  echo "[entrypoint] Cloning $GTD_CLONE_URL into /workspace..."
  CLONE_ARGS="--depth 1"
  if [ -n "$GTD_CLONE_BRANCH" ]; then
    CLONE_ARGS="$CLONE_ARGS --branch $GTD_CLONE_BRANCH"
  fi
  git clone $CLONE_ARGS "$GTD_CLONE_URL" /workspace 2>&1 || echo "[entrypoint] Clone failed, continuing with empty workspace"
  cd /workspace
  git config user.email "gtd@orchestrator"
  git config user.name "GTD Orchestrator"
fi

# If /workspace is empty and not a git repo, init one
if [ ! -d "/workspace/.git" ]; then
  cd /workspace
  git init
  git config user.email "gtd@orchestrator"
  git config user.name "GTD Orchestrator"
fi

# Start MCP bridge (which spawns gtd-mcp-server.cjs)
echo "[entrypoint] Starting MCP bridge on port $MCP_BRIDGE_PORT..."
exec npx tsx /usr/local/bin/mcp-bridge.ts
