/**
 * GTD Roadmap Module — ROADMAP.md parsing, phase extraction, progress tracking.
 * @module lib/roadmap
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter.cjs');
const { atomicWrite, ensureDir } = require('./file-ops.cjs');

const ROADMAP_FILE = 'ROADMAP.md';

/**
 * Load the roadmap from .planning/ROADMAP.md.
 * @param {string} docsRoot - .planning/ directory
 * @returns {{ exists: boolean, phases: Array, metadata: object }}
 */
function loadRoadmap(docsRoot) {
  const roadmapPath = path.join(docsRoot, ROADMAP_FILE);
  if (!fs.existsSync(roadmapPath)) {
    return { exists: false, phases: [], metadata: {} };
  }

  const content = fs.readFileSync(roadmapPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);
  const phases = parsePhases(body);

  return {
    exists: true,
    phases,
    metadata: frontmatter,
    raw: content,
  };
}

/**
 * Parse phase entries from ROADMAP.md body.
 * Expects Markdown table or heading-based format.
 *
 * @param {string} body - Markdown body
 * @returns {Array<{number: number, name: string, description: string, status: string, requirements: string[]}>}
 */
function parsePhases(body) {
  const phases = [];

  // Try table format first: | Phase | Name | Description | Status |
  const tableRows = body.match(/\|\s*\d+\s*\|[^\n]+/g);
  if (tableRows && tableRows.length > 0) {
    for (const row of tableRows) {
      const cells = row.split('|').filter(Boolean).map((c) => c.trim());
      if (cells.length >= 3) {
        const num = parseInt(cells[0], 10);
        if (!isNaN(num)) {
          phases.push({
            number: num,
            name: cells[1] || '',
            description: cells[2] || '',
            status: cells[3] || 'pending',
            requirements: extractRequirementIds(cells[2] || ''),
          });
        }
      }
    }
    return phases;
  }

  // Try heading format: ## Phase 1: Name
  const headings = body.match(/##\s*Phase\s*(\d+)[:\s]+(.+)/gi);
  if (headings) {
    for (const heading of headings) {
      const match = heading.match(/##\s*Phase\s*(\d+)[:\s]+(.+)/i);
      if (match) {
        phases.push({
          number: parseInt(match[1], 10),
          name: match[2].trim(),
          description: '',
          status: 'pending',
          requirements: [],
        });
      }
    }
  }

  return phases;
}

/**
 * Extract requirement IDs (REQ-XXX pattern) from text.
 * @param {string} text - Text containing requirement references
 * @returns {string[]} Array of requirement IDs
 */
function extractRequirementIds(text) {
  const matches = text.match(/REQ-[A-Z]+-\d+|REQ-\d+/g);
  return matches || [];
}

/**
 * Get roadmap progress summary.
 * @param {string} docsRoot - .planning/ directory
 * @returns {{ total_phases: number, completed: number, in_progress: number, pending: number }}
 */
function getRoadmapProgress(docsRoot) {
  const { phases } = loadRoadmap(docsRoot);
  return {
    total_phases: phases.length,
    completed: phases.filter((p) => p.status === 'complete' || p.status === 'done').length,
    in_progress: phases.filter((p) => p.status === 'in-progress' || p.status === 'active').length,
    pending: phases.filter(
      (p) => p.status === 'pending' || p.status === '' || p.status === 'not-started',
    ).length,
  };
}

/**
 * Get the next phase to work on (first non-complete phase).
 * @param {string} docsRoot - .planning/ directory
 * @returns {object|null} Next phase info or null
 */
function getNextPhase(docsRoot) {
  const { phases } = loadRoadmap(docsRoot);
  return (
    phases.find(
      (p) => p.status !== 'complete' && p.status !== 'done',
    ) || null
  );
}

// CLI handler
function run(args) {
  const docsRoot = path.join(process.cwd(), '.planning');
  const subcommand = args[0] || 'status';

  if (subcommand === 'status') {
    process.stdout.write(JSON.stringify(getRoadmapProgress(docsRoot), null, 2));
  } else if (subcommand === 'phases') {
    const { phases } = loadRoadmap(docsRoot);
    process.stdout.write(JSON.stringify(phases, null, 2));
  } else if (subcommand === 'next') {
    const next = getNextPhase(docsRoot);
    process.stdout.write(JSON.stringify(next, null, 2));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs roadmap <status|phases|next>\n');
    process.exit(1);
  }
}

module.exports = {
  loadRoadmap,
  parsePhases,
  extractRequirementIds,
  getRoadmapProgress,
  getNextPhase,
  run,
};
