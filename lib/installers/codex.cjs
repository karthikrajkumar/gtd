/**
 * GTD Installer Adapter — Codex runtime.
 *
 * Commands installed as skills using $gtd-* format.
 *
 * @module lib/installers/codex
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { copyFrameworkFiles, verifyInstallation } = require('../installer-core.cjs');
const { ensureDir, atomicWrite } = require('../file-ops.cjs');

const name = 'codex';

function getInstallPath(location) {
  if (location === 'global') {
    return path.join(os.homedir(), '.codex', 'get-things-done');
  }
  return path.join(process.cwd(), '.codex', 'get-things-done');
}

/**
 * Install commands as Codex skills ($gtd-* format).
 * Each workflow becomes a skill definition in the skills manifest.
 */
function copyCommands(installBase) {
  const workflowsDir = path.join(installBase, 'workflows');
  const skills = {};
  let installed = 0;

  if (!fs.existsSync(workflowsDir)) return { installed };

  for (const category of fs.readdirSync(workflowsDir)) {
    const catDir = path.join(workflowsDir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
      const cmdName = path.basename(file, '.md');
      skills[`$gtd-${cmdName}`] = {
        description: `GTD workflow — ${cmdName.replace(/-/g, ' ')}`,
        file: path.join('workflows', category, file),
        type: 'workflow',
      };
      installed++;
    }
  }

  const manifestPath = path.join(installBase, 'skills.json');
  atomicWrite(manifestPath, JSON.stringify(skills, null, 2) + '\n');

  return { installed };
}

function setupHooks(installBase) {
  // Codex discovers skills from the skills manifest.
  return { hooks: 0 };
}

module.exports = { name, getInstallPath, copyCommands, setupHooks };
