/**
 * GTD Installer Adapter — GitHub Copilot runtime.
 *
 * Framework files installed under ~/.github/get-things-done/.
 *
 * @module lib/installers/copilot
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { copyFrameworkFiles, verifyInstallation } = require('../installer-core.cjs');
const { ensureDir, atomicWrite } = require('../file-ops.cjs');

const name = 'copilot';

function getInstallPath(location) {
  if (location === 'global') {
    return path.join(os.homedir(), '.github', 'get-things-done');
  }
  return path.join(process.cwd(), '.github', 'get-things-done');
}

/**
 * Install commands as a workflow manifest for Copilot.
 * Copilot reads the manifest for available GTD commands.
 */
function copyCommands(installBase) {
  const workflowsDir = path.join(installBase, 'workflows');
  const commands = {};
  let installed = 0;

  if (!fs.existsSync(workflowsDir)) return { installed };

  for (const category of fs.readdirSync(workflowsDir)) {
    const catDir = path.join(workflowsDir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
      const cmdName = path.basename(file, '.md');
      commands[`gtd-${cmdName}`] = {
        description: `GTD workflow — ${cmdName.replace(/-/g, ' ')}`,
        file: path.join('workflows', category, file),
      };
      installed++;
    }
  }

  const manifestPath = path.join(installBase, 'commands.json');
  atomicWrite(manifestPath, JSON.stringify(commands, null, 2) + '\n');

  return { installed };
}

function setupHooks(installBase) {
  // Copilot does not require additional hook setup.
  return { hooks: 0 };
}

module.exports = { name, getInstallPath, copyCommands, setupHooks };
