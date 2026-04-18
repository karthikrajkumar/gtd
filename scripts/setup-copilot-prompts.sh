#!/usr/bin/env bash
#
# setup-copilot-prompts.sh
#
# Mirror GTD slash commands into VS Code Copilot's prompt-files folder.
#
# Why: the GTD installer writes Cursor-style commands to
#      .github/get-things-done/commands/gtd/<pipeline>/<name>.md
# but GitHub Copilot Chat reads prompt files from .github/prompts/*.prompt.md.
# This script creates WRAPPER files (not symlinks) that:
#   1. Prepend YAML front matter with `mode: agent` — forces Copilot to run
#      the prompt in Agent mode (file/search/MCP tools enabled). Without
#      this, Copilot's default Ask mode can't read the workflow files the
#      GTD prompts reference, and you get:
#        "File reading and search tools are disabled in this session"
#   2. Inline the source command body so the file stands alone.
#
# Usage (run from workspace root, after the GTD installer):
#   bash scripts/setup-copilot-prompts.sh
#
# Re-running is safe (idempotent) — wrappers are regenerated from source.

set -euo pipefail

SRC_ROOT=".github/get-things-done/commands/gtd"
DST_ROOT=".github/prompts"

if [[ ! -d "$SRC_ROOT" ]]; then
  echo "error: $SRC_ROOT not found." >&2
  echo "       Run the GTD installer first:" >&2
  echo "       npx @karthikrajkumar.kannan/get-things-done@latest --copilot --local" >&2
  echo "       (or --cursor --local — both install commands/gtd under .github/get-things-done)" >&2
  exit 1
fi

mkdir -p "$DST_ROOT"

created=0
skipped=0
collisions=()

# Iterate every command file across all pipeline folders.
while IFS= read -r -d '' src; do
  name="$(basename "$src" .md)"
  dst="$DST_ROOT/gtd-${name}.prompt.md"

  # Refuse to clobber a real file the user has hand-edited. Symlinks and
  # prior wrappers written by this script are safe to regenerate (we own
  # that filename pattern).
  if [[ -e "$dst" && ! -L "$dst" ]]; then
    if ! head -n 1 "$dst" 2>/dev/null | grep -q '^---$'; then
      collisions+=("$dst (hand-edited — refusing to overwrite)")
      skipped=$((skipped + 1))
      continue
    fi
  fi

  # Remove stale symlink from earlier script versions so we can write a
  # regular file in its place.
  [[ -L "$dst" ]] && rm -f "$dst"

  # Write wrapper: Copilot front matter + original command body verbatim.
  #
  # `mode: agent` forces Copilot to run with file/search/MCP tools enabled
  # so it can actually read workflows/<pipeline>/<name>.md and follow the
  # multi-step flow. Without this the prompt runs in Ask mode and bails.
  {
    printf -- '---\n'
    printf -- 'mode: agent\n'
    printf -- 'description: GTD command — %s\n' "$name"
    printf -- '---\n'
    cat "$src"
  } > "$dst"

  created=$((created + 1))
done < <(find "$SRC_ROOT" -type f -name "*.md" -print0)

echo "Wrote $created prompt files into $DST_ROOT/"
if (( skipped > 0 )); then
  echo "Skipped $skipped due to collisions:" >&2
  printf '  - %s\n' "${collisions[@]}" >&2
fi

# ---------------------------------------------------------------------------
# Heal missing lib/ — the --cursor --local installer sometimes drops bin/
# without the sibling lib/ directory that bin/gtd-tools.cjs requires
# (../lib/init.cjs, ../lib/state.cjs, ...). When that happens, Copilot
# prints: "missing its lib/ implementation (can't find ../lib/init.cjs)"
# and the init/state helpers fall back to manual mode. We fix it by
# linking lib/ from wherever the full npm package lives.
# ---------------------------------------------------------------------------
GTD_ROOT=".github/get-things-done"

if [[ ! -d "$GTD_ROOT/lib" ]]; then
  echo ""
  echo "Checking for missing $GTD_ROOT/lib ..."

  lib_source=""

  # 1) Global npm install
  if command -v npm >/dev/null 2>&1; then
    npm_root="$(npm root -g 2>/dev/null || true)"
    candidate="$npm_root/@karthikrajkumar.kannan/get-things-done/lib"
    if [[ -n "$npm_root" && -d "$candidate" ]]; then
      lib_source="$candidate"
    fi
  fi

  # 2) npx cache (~/.npm/_npx/<hash>/node_modules/...)
  if [[ -z "$lib_source" && -d "$HOME/.npm/_npx" ]]; then
    candidate="$(find "$HOME/.npm/_npx" -type d \
                   -path "*@karthikrajkumar.kannan/get-things-done/lib" \
                   2>/dev/null | head -n 1)"
    [[ -n "$candidate" ]] && lib_source="$candidate"
  fi

  # 3) Local node_modules (if user `npm i`d the package)
  if [[ -z "$lib_source" ]]; then
    candidate="node_modules/@karthikrajkumar.kannan/get-things-done/lib"
    [[ -d "$candidate" ]] && lib_source="$(cd "$candidate" && pwd)"
  fi

  if [[ -n "$lib_source" ]]; then
    ln -sfn "$lib_source" "$GTD_ROOT/lib"
    echo "  → linked $GTD_ROOT/lib  →  $lib_source"
  else
    echo "  ! could not locate the package's lib/ directory." >&2
    echo "    Searched: npm -g, ~/.npm/_npx, ./node_modules." >&2
    echo "    Workaround: run" >&2
    echo "      npm i -g @karthikrajkumar.kannan/get-things-done" >&2
    echo "    then re-run this script." >&2
    echo "    (The questioning / research / roadmap flow still works" >&2
    echo "     without lib/ — only automation shortcuts are disabled.)" >&2
  fi
else
  echo "$GTD_ROOT/lib present — skipping lib heal."
fi

cat <<'NEXT'

Next steps:
  1. Reload VS Code: Cmd+Shift+P → "Developer: Reload Window".
  2. In Copilot Chat, switch the mode dropdown to "Agent" (bottom of the
     chat panel). The front matter in each prompt also requests agent mode,
     but the dropdown setting is respected as a ceiling — if it's on "Ask",
     tools stay disabled regardless of the prompt.
  3. Type "/gtd-" and pick a command. It should now be able to read
     workflow files and follow the multi-step flow.

Re-run this script any time you upgrade the GTD package to pick up new or
changed commands.
NEXT
