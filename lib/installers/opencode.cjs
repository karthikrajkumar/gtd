/**
 * GTD Installer Adapter — OpenCode runtime.
 *
 * Commands installed as slash commands in OpenCode config.
 *
 * @module lib/installers/opencode
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { copyFrameworkFiles, verifyInstallation } = require('../installer-core.cjs');
const { ensureDir, atomicWrite } = require('../file-ops.cjs');

const name = 'opencode';

function getInstallPath(location) {
  if (location === 'global') {
    return path.join(os.homedir(), '.config', 'opencode', 'get-things-done');
  }
  return path.join(process.cwd(), '.opencode', 'get-things-done');
}

/**
 * Install commands as OpenCode slash commands.
 * Writes a commands manifest that OpenCode reads on startup.
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
  // OpenCode discovers slash commands from the commands manifest.
  return { hooks: 0 };
}

module.exports = { name, getInstallPath, copyCommands, setupHooks };
