#!/usr/bin/env node

/**
 * GTD Installer — Entry point for `npx get-things-done@latest`
 *
 * Installs the Get Things Done framework for the selected AI coding runtime(s).
 * Supports: Claude Code, OpenCode, Gemini CLI, Codex, Copilot, Cursor, Windsurf, Augment, Cline.
 *
 * Usage:
 *   npx get-things-done@latest              # Interactive mode
 *   npx get-things-done --claude --global   # Non-interactive
 *   npx get-things-done --all --local       # All runtimes, local install
 */

'use strict';

const PACKAGE_VERSION = require('../package.json').version;

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`get-things-done v${PACKAGE_VERSION}`);
    process.exit(0);
  }

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  // TODO: Phase 12 — Full installer implementation
  console.log(`\n  Get Things Done v${PACKAGE_VERSION}`);
  console.log('  Bidirectional spec-driven agentic framework\n');
  console.log('  Installer will be implemented in Phase 12.');
  console.log('  For now, use the development installation.\n');
}

function printHelp() {
  console.log(`
  Get Things Done (GTD) v${PACKAGE_VERSION}
  Bidirectional spec-driven agentic framework

  Usage:
    npx get-things-done@latest [options]

  Runtime flags:
    --claude        Install for Claude Code
    --opencode      Install for OpenCode
    --gemini        Install for Gemini CLI
    --codex         Install for Codex
    --copilot       Install for Copilot
    --cursor        Install for Cursor
    --windsurf      Install for Windsurf
    --augment       Install for Augment
    --cline         Install for Cline
    --all           Install for all runtimes

  Location flags:
    --global, -g    Install globally (~/)
    --local, -l     Install locally (./)

  Other:
    --version, -v   Show version
    --help, -h      Show this help
  `);
}

main().catch((err) => {
  console.error('Installation failed:', err.message);
  process.exit(1);
});
