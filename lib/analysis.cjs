/**
 * GTD Analysis Cache Module — Manages analysis artifacts in .planning/analysis/
 *
 * Each analysis dimension writes a Markdown file with YAML frontmatter:
 *   ---
 *   dimension: architecture
 *   commit: abc1234
 *   timestamp: 2026-04-10T10:00:00Z
 *   files_analyzed: 145
 *   ---
 *   # Architecture Analysis
 *   ...
 *
 * Cache validity is determined by comparing stored commit hash with current HEAD.
 *
 * @module lib/analysis
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter.cjs');

const ANALYSIS_DIR = 'analysis';
const CODEBASE_MAP_FILE = 'CODEBASE-MAP.md';
const FILE_INDEX_FILE = 'analysis/FILE-INDEX.json';

/**
 * All recognized analysis dimensions.
 */
const DIMENSIONS = [
  'architecture',
  'api',
  'data-flow',
  'dependencies',
  'security',
  'performance',
];

/**
 * Get the status of all analysis dimensions.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @returns {{ dimensions: Object, complete: boolean, total: number, current: number }}
 */
function getAnalysisStatus(docsRoot) {
  const analysisDir = path.join(docsRoot, ANALYSIS_DIR);
  const dimensions = {};
  let currentCount = 0;

  if (!fs.existsSync(analysisDir)) {
    // Return all dimensions as 'missing'
    for (const dim of DIMENSIONS) {
      dimensions[dim] = { status: 'missing', commit: null, stale: true, timestamp: null, files_analyzed: 0 };
    }
    return { dimensions, complete: false, total: DIMENSIONS.length, current: 0 };
  }

  // Read current git commit for staleness check
  let currentCommit = null;
  try {
    const { getGitCommit } = require('./git.cjs');
    currentCommit = getGitCommit(path.dirname(docsRoot));
  } catch (_) {
    // Git not available — can't determine staleness
  }

  for (const dim of DIMENSIONS) {
    const dimFile = path.join(analysisDir, `${dim.toUpperCase().replace(/-/g, '_')}.md`);
    const altFile = path.join(analysisDir, `${dim.toUpperCase().replace(/-/g, '-')}-ANALYSIS.md`);

    let filePath = null;
    if (fs.existsSync(dimFile)) filePath = dimFile;
    else if (fs.existsSync(altFile)) filePath = altFile;

    // Also check common naming patterns with multiple matching strategies
    if (!filePath) {
      const entries = fs.existsSync(analysisDir) ? fs.readdirSync(analysisDir) : [];
      const dimLower = dim.toLowerCase();
      const dimNoHyphens = dimLower.replace(/-/g, '');
      const dimUnderscored = dimLower.replace(/-/g, '_');
      const match = entries.find((e) => {
        if (!e.endsWith('.md')) return false;
        const eLower = e.toLowerCase();
        return (
          eLower.includes(dimLower) ||           // data-flow in DATA-FLOW.md
          eLower.includes(dimNoHyphens) ||        // dataflow
          eLower.includes(dimUnderscored) ||      // data_flow
          eLower.replace(/-/g, '').includes(dimNoHyphens)  // strip hyphens from filename too
        );
      });
      if (match) filePath = path.join(analysisDir, match);
    }

    if (!filePath) {
      dimensions[dim] = { status: 'missing', commit: null, stale: true, timestamp: null, files_analyzed: 0 };
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const { frontmatter } = parseFrontmatter(content);

      const storedCommit = frontmatter.commit || null;
      const isStale = currentCommit ? storedCommit !== currentCommit : false;

      dimensions[dim] = {
        status: 'complete',
        commit: storedCommit,
        stale: isStale,
        timestamp: frontmatter.timestamp || null,
        files_analyzed: frontmatter.files_analyzed || 0,
        file: filePath,
      };

      if (!isStale) currentCount++;
    } catch (_) {
      dimensions[dim] = { status: 'error', commit: null, stale: true, timestamp: null, files_analyzed: 0 };
    }
  }

  return {
    dimensions,
    complete: currentCount >= DIMENSIONS.length,
    total: DIMENSIONS.length,
    current: currentCount,
  };
}

/**
 * Check if a specific analysis dimension is stale.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @param {string} dimension - Dimension name
 * @returns {boolean} True if stale or missing
 */
function isStale(docsRoot, dimension) {
  const status = getAnalysisStatus(docsRoot);
  const dim = status.dimensions[dimension];
  return !dim || dim.status !== 'complete' || dim.stale;
}

/**
 * Get all stale dimension names.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @returns {string[]} List of stale dimension names
 */
function getStaleDimensions(docsRoot) {
  const status = getAnalysisStatus(docsRoot);
  return Object.entries(status.dimensions)
    .filter(([_, v]) => v.status !== 'complete' || v.stale)
    .map(([k, _]) => k);
}

/**
 * Get the status of the codebase map.
 *
 * @param {string} docsRoot - Path to .planning/ directory
 * @returns {{ exists: boolean, commit: string|null, stale: boolean, timestamp: string|null }}
 */
function getCodebaseMapStatus(docsRoot) {
  const mapPath = path.join(docsRoot, CODEBASE_MAP_FILE);

  if (!fs.existsSync(mapPath)) {
    return { exists: false, commit: null, stale: true, timestamp: null };
  }

  try {
    const content = fs.readFileSync(mapPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);

    let currentCommit = null;
    try {
      const { getGitCommit } = require('./git.cjs');
      currentCommit = getGitCommit(path.dirname(docsRoot));
    } catch (_) {}

    const storedCommit = frontmatter.commit || null;

    return {
      exists: true,
      commit: storedCommit,
      stale: currentCommit ? storedCommit !== currentCommit : false,
      timestamp: frontmatter.timestamp || null,
    };
  } catch (_) {
    return { exists: true, commit: null, stale: true, timestamp: null };
  }
}

/**
 * Get the required analysis dimensions for a given document type.
 *
 * @param {string} docType - Document type (tdd, hld, lld, etc.)
 * @returns {string[]} Required dimension names
 */
function getRequiredDimensions(docType) {
  const DOC_DIMENSIONS = {
    tdd: ['architecture', 'dependencies', 'data-flow'],
    hld: ['architecture', 'data-flow', 'dependencies'],
    lld: ['architecture', 'data-flow', 'api'],
    capacity: ['dependencies', 'performance', 'architecture'],
    'system-design': ['architecture', 'api', 'data-flow', 'dependencies', 'security', 'performance'],
    'api-docs': ['api'],
    runbook: ['architecture', 'security', 'dependencies'],
  };

  return DOC_DIMENSIONS[docType] || DIMENSIONS;
}

// CLI handler
function run(args) {
  const docsRoot = path.join(process.cwd(), '.planning');
  const subcommand = args[0] || 'status';

  if (subcommand === 'status') {
    process.stdout.write(JSON.stringify(getAnalysisStatus(docsRoot), null, 2));
  } else if (subcommand === 'stale') {
    process.stdout.write(JSON.stringify(getStaleDimensions(docsRoot)));
  } else if (subcommand === 'stale-for' && args[1]) {
    const required = getRequiredDimensions(args[1]);
    const stale = getStaleDimensions(docsRoot).filter((d) => required.includes(d));
    process.stdout.write(JSON.stringify(stale));
  } else if (subcommand === 'map-status') {
    process.stdout.write(JSON.stringify(getCodebaseMapStatus(docsRoot), null, 2));
  } else {
    process.stderr.write(`Unknown analysis subcommand: ${subcommand}\n`);
    process.exit(1);
  }
}

module.exports = {
  DIMENSIONS,
  getAnalysisStatus,
  isStale,
  getStaleDimensions,
  getCodebaseMapStatus,
  getRequiredDimensions,
  run,
};
