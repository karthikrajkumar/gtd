/**
 * GTD Installer Adapter — Cursor runtime.
 *
 * Cursor reads commands from .cursor/skills/<name>/SKILL.md at the PROJECT level.
 * This is the same format as Claude Code skills.
 *
 * Install location:
 *   Local:  PROJECT/.cursor/skills/gtd-COMMAND/SKILL.md  (recommended for Cursor)
 *   Global: HOME/.cursor/skills/gtd-COMMAND/SKILL.md
 *
 * Framework files go to:
 *   Local:  PROJECT/.cursor/get-things-done/
 *   Global: HOME/.cursor/get-things-done/
 *
 * @module lib/installers/cursor
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { copyFrameworkFiles, verifyInstallation } = require('../installer-core.cjs');
const { ensureDir, atomicWrite } = require('../file-ops.cjs');

const name = 'cursor';

function getInstallPath(location) {
  if (location === 'global') {
    return path.join(os.homedir(), '.cursor', 'get-things-done');
  }
  return path.join(process.cwd(), '.cursor', 'get-things-done');
}

// Install commands as .cursor/skills/gtd-COMMAND/SKILL.md files.
// This is the format Cursor recognizes as slash commands.
function copyCommands(installBase) {
  // Determine the .cursor root (parent of get-things-done/)
  const cursorRoot = path.dirname(installBase);
  const skillsDir = path.join(cursorRoot, 'skills');
  let installed = 0;

  // Read all command files from commands/gtd/
  const commandsBase = path.join(installBase, 'commands', 'gtd');
  if (!fs.existsSync(commandsBase)) return { installed };

  for (const category of ['backward', 'forward', 'sync', 'utility']) {
    const catDir = path.join(commandsBase, category);
    if (!fs.existsSync(catDir)) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
      const cmdName = path.basename(file, '.md');
      const skillName = `gtd-${cmdName}`;
      const skillDir = path.join(skillsDir, skillName);

      ensureDir(skillDir);

      // Read the original command file
      const content = fs.readFileSync(path.join(catDir, file), 'utf8');

      // Write as SKILL.md (Cursor skill format)
      atomicWrite(path.join(skillDir, 'SKILL.md'), content);
      installed++;
    }
  }

  console.log(`    Skills: ${installed} commands installed to ${skillsDir}`);
  return { installed };
}

function setupHooks(installBase) {
  // No additional hooks needed for Cursor
  return { hooks: 0 };
}

module.exports = { name, getInstallPath, copyCommands, setupHooks };
