/**
 * GTD Installer Adapter — Cline runtime.
 *
 * Global: ~/.cline/get-things-done/
 * Local: .clinerules file (special — Cline uses a single .clinerules file).
 * Commands are embedded as sections within .clinerules.
 *
 * @module lib/installers/cline
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const { copyFrameworkFiles, verifyInstallation } = require('../installer-core.cjs');
const { ensureDir, atomicWrite } = require('../file-ops.cjs');

const name = 'cline';

function getInstallPath(location) {
  if (location === 'global') {
    return path.join(os.homedir(), '.cline', 'get-things-done');
  }
  // Cline local install still needs a directory for framework files.
  // The .clinerules file is written separately by setupHooks.
  return path.join(process.cwd(), '.cline', 'get-things-done');
}

/**
 * Install commands by embedding them in the .clinerules file.
 * Each workflow becomes a named section in the rules file.
 */
function copyCommands(installBase) {
  const workflowsDir = path.join(installBase, 'workflows');
  const sections = [];
  let installed = 0;

  if (!fs.existsSync(workflowsDir)) return { installed };

  for (const category of fs.readdirSync(workflowsDir)) {
    const catDir = path.join(workflowsDir, category);
    if (!fs.statSync(catDir).isDirectory()) continue;

    for (const file of fs.readdirSync(catDir).filter((f) => f.endsWith('.md'))) {
      const cmdName = path.basename(file, '.md');
      const relPath = path.join('workflows', category, file);
      sections.push(
        `## gtd-${cmdName}`,
        `When the user invokes "gtd-${cmdName}", follow the workflow in:`,
        `  ${path.join(path.relative(process.cwd(), installBase), relPath)}`,
        '',
      );
      installed++;
    }
  }

  return { installed, sections };
}

/**
 * Write (or update) the .clinerules file with GTD command sections.
 * Preserves any existing user content outside the GTD block.
 */
function setupHooks(installBase) {
  const rulesPath = path.join(process.cwd(), '.clinerules');
  const marker = {
    start: '# --- GTD Framework (auto-generated) ---',
    end: '# --- End GTD Framework ---',
  };

  const { sections } = copyCommands(installBase);
  if (!sections || sections.length === 0) return { hooks: 0 };

  const gtdBlock = [marker.start, '', ...sections, marker.end, ''].join('\n');

  let existing = '';
  if (fs.existsSync(rulesPath)) {
    existing = fs.readFileSync(rulesPath, 'utf8');
    // Replace existing GTD block if present
    const re = new RegExp(
      `${marker.start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${marker.end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`,
    );
    if (re.test(existing)) {
      atomicWrite(rulesPath, existing.replace(re, gtdBlock));
      return { hooks: 1 };
    }
  }

  // Append GTD block
  const content = existing ? existing.trimEnd() + '\n\n' + gtdBlock : gtdBlock;
  atomicWrite(rulesPath, content);
  return { hooks: 1 };
}

module.exports = { name, getInstallPath, copyCommands, setupHooks };
