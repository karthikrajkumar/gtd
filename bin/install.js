#!/usr/bin/env node

/**
 * GTD Installer — Entry point for `npx get-things-done@latest`
 *
 * Installs the Get Things Done framework for the selected AI coding runtime(s).
 *
 * Usage:
 *   npx get-things-done@latest                    # Interactive
 *   npx get-things-done --claude --global         # Non-interactive
 *   npx get-things-done --all --local             # All runtimes, local
 */

'use strict';

const path = require('path');
const readline = require('readline');
const {
  copyFrameworkFiles,
  verifyInstallation,
  writeVersionMarker,
  getInstalledVersion,
} = require('../lib/installer-core.cjs');

const PKG = require('../package.json');
const VERSION = PKG.version;

// Runtime registry — adapter loaded lazily
const RUNTIMES = {
  claude: { flag: '--claude', name: 'Claude Code', module: '../lib/installers/claude.cjs' },
  opencode: { flag: '--opencode', name: 'OpenCode', module: '../lib/installers/opencode.cjs' },
  gemini: { flag: '--gemini', name: 'Gemini CLI', module: '../lib/installers/gemini.cjs' },
  codex: { flag: '--codex', name: 'Codex', module: '../lib/installers/codex.cjs' },
  copilot: { flag: '--copilot', name: 'Copilot', module: '../lib/installers/copilot.cjs' },
  cursor: { flag: '--cursor', name: 'Cursor', module: '../lib/installers/cursor.cjs' },
  windsurf: { flag: '--windsurf', name: 'Windsurf', module: '../lib/installers/windsurf.cjs' },
  augment: { flag: '--augment', name: 'Augment', module: '../lib/installers/augment.cjs' },
  cline: { flag: '--cline', name: 'Cline', module: '../lib/installers/cline.cjs' },
};

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`get-things-done v${VERSION}`);
    process.exit(0);
  }
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  console.log(`\n  Get Things Done v${VERSION}`);
  console.log('  Forward. Backward. In Sync.\n');

  // Step 1: Select runtime(s)
  let selectedRuntimes;
  if (args.includes('--all')) {
    selectedRuntimes = Object.keys(RUNTIMES);
  } else {
    const flagged = Object.entries(RUNTIMES)
      .filter(([_, r]) => args.includes(r.flag))
      .map(([key]) => key);
    selectedRuntimes = flagged.length > 0 ? flagged : await promptRuntimes();
  }

  // Step 2: Select location
  let location;
  if (args.includes('--global') || args.includes('-g')) location = 'global';
  else if (args.includes('--local') || args.includes('-l')) location = 'local';
  else location = await promptLocation();

  // Step 3: Install
  console.log('');
  let totalInstalled = 0;

  for (const key of selectedRuntimes) {
    const runtime = RUNTIMES[key];
    let adapter;
    try {
      adapter = require(runtime.module);
    } catch (err) {
      console.log(`  ✗ ${runtime.name}: adapter error (${err.message})`);
      continue;
    }

    const installPath = adapter.getInstallPath(location);
    console.log(`  Installing for ${runtime.name}...`);
    console.log(`    Path: ${installPath}`);

    const existing = getInstalledVersion(installPath);
    if (existing) console.log(`    Updating: v${existing} → v${VERSION}`);

    const { copied, errors } = copyFrameworkFiles(installPath);
    if (adapter.copyCommands) try { adapter.copyCommands(installPath); } catch (e) { errors.push(e.message); }
    if (adapter.setupHooks) try { adapter.setupHooks(installPath); } catch (e) { errors.push(e.message); }

    writeVersionMarker(installPath, VERSION);
    const health = verifyInstallation(installPath);

    if (health.ok && errors.length === 0) {
      console.log(`    ✓ Done (${copied} files)`);
    } else {
      console.log(`    ⚠ Done with warnings:`);
      errors.forEach((e) => console.log(`      - ${e}`));
      health.missing.forEach((m) => console.log(`      - Missing: ${m}`));
    }
    totalInstalled++;
    console.log('');
  }

  console.log(`  ✓ GTD v${VERSION} installed for ${totalInstalled} runtime(s)\n`);
  console.log('  Quick start:');
  console.log('    /gtd-scan          Scan existing codebase');
  console.log('    /gtd-new-project   Start new project');
  console.log('    /gtd-help          See all commands\n');
}

async function promptRuntimes() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const list = Object.entries(RUNTIMES);
  console.log('  Select runtime(s):\n');
  list.forEach(([_, r], i) => console.log(`    ${i + 1}. ${r.name}`));
  console.log(`    ${list.length + 1}. All\n`);

  return new Promise((resolve) => {
    rl.question('  Enter numbers (comma-separated): ', (answer) => {
      rl.close();
      const nums = answer.split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n));
      if (nums.includes(list.length + 1)) return resolve(Object.keys(RUNTIMES));
      const selected = nums.filter((n) => n >= 1 && n <= list.length).map((n) => list[n - 1][0]);
      resolve(selected.length > 0 ? selected : ['claude']);
    });
  });
}

async function promptLocation() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('  Location:\n    1. Global (all projects)\n    2. Local (current project)\n');
  return new Promise((resolve) => {
    rl.question('  Enter 1 or 2: ', (answer) => {
      rl.close();
      resolve(answer.trim() === '2' ? 'local' : 'global');
    });
  });
}

function printHelp() {
  console.log(`
  Get Things Done (GTD) v${VERSION}
  Forward. Backward. In Sync.

  Usage: npx get-things-done@latest [options]

  Runtimes: --claude --opencode --gemini --codex --copilot --cursor --windsurf --augment --cline --all
  Location: --global (-g) | --local (-l)
  Other:    --version (-v) | --help (-h)
  `);
}

main().catch((err) => {
  console.error('\n  Installation failed:', err.message);
  process.exit(1);
});
