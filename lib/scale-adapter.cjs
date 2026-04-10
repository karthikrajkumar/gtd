/**
 * GTD Scale Adapter — Project tier detection and adaptive behavior configuration.
 *
 * Adjusts scan strategy, analysis depth, document structure, and agent concurrency
 * based on project size.
 *
 * @module lib/scale-adapter
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Project tiers with thresholds and behavior adjustments.
 */
const TIERS = {
  micro: {
    maxFiles: 5,
    maxLines: 1000,
    label: 'Micro',
    scanStrategy: 'full',
    analysisDepth: 'shallow',
    docStrategy: 'combined',
    maxAgentReads: 5,
    parallelAnalyzers: 1,
    description: 'Single utility, small script — combined single document',
  },
  small: {
    maxFiles: 50,
    maxLines: 10000,
    label: 'Small',
    scanStrategy: 'full',
    analysisDepth: 'standard',
    docStrategy: 'standard',
    maxAgentReads: 30,
    parallelAnalyzers: 4,
    description: 'CLI tool, small web app — standard 7-document set',
  },
  medium: {
    maxFiles: 500,
    maxLines: 100000,
    label: 'Medium',
    scanStrategy: 'full-with-exclusions',
    analysisDepth: 'standard',
    docStrategy: 'full',
    maxAgentReads: 50,
    parallelAnalyzers: 6,
    description: 'Standard SaaS application — full document suite with cross-references',
  },
  large: {
    maxFiles: 5000,
    maxLines: 1000000,
    label: 'Large',
    scanStrategy: 'module-chunked',
    analysisDepth: 'deep',
    docStrategy: 'domain-decomposed',
    maxAgentReads: 100,
    parallelAnalyzers: 7,
    description: 'Enterprise application — per-domain documents with index',
  },
  enterprise: {
    maxFiles: Infinity,
    maxLines: Infinity,
    label: 'Enterprise',
    scanStrategy: 'service-boundary',
    analysisDepth: 'deep',
    docStrategy: 'service-level',
    maxAgentReads: 150,
    parallelAnalyzers: 7,
    description: 'Monorepo / microservices — service-level docs + integration maps',
  },
};

/**
 * Detect project tier based on file count.
 *
 * @param {number} fileCount - Number of source files
 * @returns {{ tier: string, config: object }}
 */
function detectTier(fileCount) {
  if (fileCount <= TIERS.micro.maxFiles) return { tier: 'micro', config: TIERS.micro };
  if (fileCount <= TIERS.small.maxFiles) return { tier: 'small', config: TIERS.small };
  if (fileCount <= TIERS.medium.maxFiles) return { tier: 'medium', config: TIERS.medium };
  if (fileCount <= TIERS.large.maxFiles) return { tier: 'large', config: TIERS.large };
  return { tier: 'enterprise', config: TIERS.enterprise };
}

/**
 * Detect project tier from a .planning/ directory (reads FILE-INDEX.json or CODEBASE-MAP.md).
 *
 * @param {string} docsRoot - .planning/ directory
 * @returns {{ tier: string, config: object, fileCount: number }}
 */
function detectTierFromProject(docsRoot) {
  // Try FILE-INDEX.json first
  const indexPath = path.join(docsRoot, 'analysis', 'FILE-INDEX.json');
  if (fs.existsSync(indexPath)) {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const fileCount = index.stats?.total_files || 0;
      const { tier, config } = detectTier(fileCount);
      return { tier, config, fileCount };
    } catch (_) {}
  }

  // Fallback: count files in CODEBASE-MAP.md frontmatter
  const mapPath = path.join(docsRoot, 'CODEBASE-MAP.md');
  if (fs.existsSync(mapPath)) {
    try {
      const content = fs.readFileSync(mapPath, 'utf8');
      const match = content.match(/files_indexed:\s*(\d+)/);
      if (match) {
        const fileCount = parseInt(match[1], 10);
        const { tier, config } = detectTier(fileCount);
        return { tier, config, fileCount };
      }
    } catch (_) {}
  }

  // Default to medium
  return { tier: 'medium', config: TIERS.medium, fileCount: 0 };
}

/**
 * Get adaptive config overrides based on project tier.
 * These override config.json defaults for the current run.
 *
 * @param {string} tier - Project tier
 * @returns {object} Config overrides
 */
function getAdaptiveConfig(tier) {
  const config = TIERS[tier] || TIERS.medium;
  return {
    scan: {
      max_files: config.maxFiles === Infinity ? 50000 : config.maxFiles * 2,
    },
    analysis: {
      depth: config.analysisDepth,
      max_file_reads: config.maxAgentReads,
    },
    workflow: {
      parallel_analyzers: config.parallelAnalyzers,
    },
    documents: {
      strategy: config.docStrategy,
    },
  };
}

/**
 * Determine if domain decomposition is needed.
 * @param {string} tier - Project tier
 * @returns {boolean}
 */
function needsDecomposition(tier) {
  return tier === 'large' || tier === 'enterprise';
}

// CLI handler
function run(args) {
  const docsRoot = path.join(process.cwd(), '.planning');
  const subcommand = args[0] || 'detect';

  if (subcommand === 'detect') {
    process.stdout.write(JSON.stringify(detectTierFromProject(docsRoot), null, 2));
  } else if (subcommand === 'config' && args[1]) {
    process.stdout.write(JSON.stringify(getAdaptiveConfig(args[1]), null, 2));
  } else if (subcommand === 'tiers') {
    const summary = Object.entries(TIERS).map(([name, config]) => ({
      tier: name,
      maxFiles: config.maxFiles === Infinity ? '5000+' : config.maxFiles,
      depth: config.analysisDepth,
      docStrategy: config.docStrategy,
      description: config.description,
    }));
    process.stdout.write(JSON.stringify(summary, null, 2));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs scale <detect|config|tiers> [tier]\n');
    process.exit(1);
  }
}

module.exports = {
  TIERS,
  detectTier,
  detectTierFromProject,
  getAdaptiveConfig,
  needsDecomposition,
  run,
};
