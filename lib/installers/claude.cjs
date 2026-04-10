/**
 * GTD Installer Adapter — Claude Code runtime.
 *
 * Skills installed as SKILL.md files (Claude Code 2.1.88+).
 * Agents copied to ~/.claude/agents/gtd-*.md.
 *
 * @module lib/installers/claude
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { copyFrameworkFiles, verifyInstallation } = require('../installer-core.cjs');
const { ensureDir, atomicWrite } = require('../file-ops.cjs');

const name = 'claude';

function getInstallPath(location) {
  if (location === 'global') {
    return path.join(os.homedir(), '.claude', 'get-things-done');
  }
  return path.join(process.cwd(), '.claude', 'get-things-done');
}

/**
 * Install commands as Claude Code skills (SKILL.md files).
 * Each workflow becomes ~/.claude/skills/gtd-<name>/SKILL.md.
 */
function copyCommands(installBase) {
  const skillsDir = path.join(os.homedir(), '.claude', 'skills');
  const workflowsDir = path.join(installBase, 'workflows');
  let installed = 0;

  if (!fs.existsSync(workflowsDir)) return { installed };

  for (const category of fs.readdirSync(workflowsDir)) {
    const catDir = path.join(workflowsDir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
      const cmdName = path.basename(file, '.md');
      const skillDir = path.join(skillsDir, `gtd-${cmdName}`);
      ensureDir(skillDir);

      const workflowRef = path.relative(os.homedir(), path.join(catDir, file));
      const skillContent = [
        `---`,
        `name: gtd-${cmdName}`,
        `description: GTD workflow — ${cmdName.replace(/-/g, ' ')}`,
        `---`,
        ``,
        `Run the GTD workflow defined in ~/${workflowRef}`,
        ``,
        `Follow the instructions in that file exactly.`,
        ``,
      ].join('\n');

      atomicWrite(path.join(skillDir, 'SKILL.md'), skillContent);
      installed++;
    }
  }

  // Copy agents to ~/.claude/agents/
  const agentsDir = path.join(installBase, 'agents');
  const destAgents = path.join(os.homedir(), '.claude', 'agents');
  if (fs.existsSync(agentsDir)) {
    ensureDir(destAgents);
    for (const category of fs.readdirSync(agentsDir)) {
      const catDir = path.join(agentsDir, category);
      if (!fs.statSync(catDir).isDirectory()) continue;
      for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
        fs.copyFileSync(path.join(catDir, file), path.join(destAgents, file));
        installed++;
      }
    }
  }

  return { installed };
}

function setupHooks(installBase) {
  // Claude Code does not require additional hook setup.
  // Skills are auto-discovered from ~/.claude/skills/.
  return { hooks: 0 };
}

module.exports = { name, getInstallPath, copyCommands, setupHooks };
