#!/usr/bin/env bash
#
# setup-copilot-prompts.sh
#
# Mirror GTD slash commands into VS Code Copilot's prompt-files folder.
#
# Why: the GTD installer writes Cursor-style commands to
#      .github/get-things-done/commands/gtd/<pipeline>/<name>.md
# but GitHub Copilot Chat reads prompt files from .github/prompts/*.prompt.md.
# This script creates symlinks so both tools work from the same source.
#
# Usage (run from workspace root, after `npx @karthikrajkumar.kannan/get-things-done@latest ...`):
#   bash scripts/setup-copilot-prompts.sh
#
# Re-running is safe (idempotent). Collisions are detected and reported.

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

  # If the destination already exists and points elsewhere, warn but don't clobber.
  if [[ -L "$dst" ]]; then
    existing_target="$(readlink "$dst")"
    expected_target="../${src#.github/}"
    if [[ "$existing_target" != "$expected_target" ]]; then
      collisions+=("$dst (existing: $existing_target, new: $expected_target)")
      skipped=$((skipped + 1))
      continue
    fi
  elif [[ -e "$dst" ]]; then
    collisions+=("$dst (not a symlink — refusing to overwrite)")
    skipped=$((skipped + 1))
    continue
  fi

  # Relative symlink from .github/prompts/ back up to .github/get-things-done/...
  ln -sfn "../${src#.github/}" "$dst"
  created=$((created + 1))
done < <(find "$SRC_ROOT" -type f -name "*.md" -print0)

echo "Linked $created prompt files into $DST_ROOT/"
if (( skipped > 0 )); then
  echo "Skipped $skipped due to collisions:" >&2
  printf '  - %s\n' "${collisions[@]}" >&2
fi

cat <<'NEXT'

Next steps:
  1. In VS Code, ensure the setting "Chat: Prompt Files Locations" includes
     .github/prompts (value: true). Already set if you followed the screenshot.
  2. Reload the window: Cmd+Shift+P → "Developer: Reload Window".
  3. In Copilot Chat, type "/gtd-" — your commands should appear in the dropdown.
NEXT
