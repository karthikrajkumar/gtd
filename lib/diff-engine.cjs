/**
 * GTD Diff Engine — Change detection, impact mapping, section-level targeting.
 *
 * Maps code changes to affected document sections for incremental updates.
 *
 * @module lib/diff-engine
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { fileExists } = require('./file-ops.cjs');

/**
 * File change → affected analysis dimension mapping.
 * Pattern keys are matched against changed file paths.
 */
const IMPACT_MAP = [
  { pattern: /src\/.*\.(ts|js|py|go|rs|java|rb)$/, dimensions: ['architecture', 'data-flow', 'performance'] },
  { pattern: /route|controller|handler|endpoint/i, dimensions: ['api'] },
  { pattern: /model|entity|schema/i, dimensions: ['data-flow', 'architecture'] },
  { pattern: /auth|security|permission|guard/i, dimensions: ['security'] },
  { pattern: /middleware|interceptor/i, dimensions: ['security', 'data-flow'] },
  { pattern: /test|spec|__tests__/i, dimensions: ['architecture'] },
  { pattern: /package\.json|go\.mod|Cargo\.toml|requirements\.txt|pyproject\.toml/, dimensions: ['dependencies'] },
  { pattern: /Dockerfile|docker-compose|compose\./i, dimensions: ['architecture', 'performance'] },
  { pattern: /k8s|kubernetes|helm|chart/i, dimensions: ['architecture', 'performance'] },
  { pattern: /\.tf$|terraform/i, dimensions: ['architecture'] },
  { pattern: /\.github\/workflows|\.gitlab-ci|Jenkinsfile/i, dimensions: ['architecture'] },
  { pattern: /prisma|migration|\.sql$/i, dimensions: ['data-flow', 'dependencies'] },
  { pattern: /\.env|config\./i, dimensions: ['security'] },
];

/**
 * Analysis dimension → document section mapping.
 */
const DIMENSION_TO_SECTION = {
  tdd: {
    architecture: ['architecture-overview', 'component-design', 'deployment'],
    api: ['api-design'],
    'data-flow': ['data-model', 'component-design'],
    dependencies: ['dependencies', 'deployment'],
    security: ['security-design'],
    performance: ['performance'],
  },
  hld: {
    architecture: ['architecture', 'subsystems', 'deployment'],
    api: ['integration-points'],
    'data-flow': ['data-flow', 'subsystems'],
    dependencies: ['deployment', 'cross-cutting'],
    security: ['cross-cutting'],
    performance: ['cross-cutting'],
  },
  lld: {
    architecture: ['module-overview', 'module-specs'],
    api: ['api-specs', 'endpoint-details'],
    'data-flow': ['data-structures', 'query-patterns'],
    dependencies: ['dependency-graph', 'configuration'],
    security: ['error-handling'],
    performance: ['algorithms'],
  },
  'api-docs': {
    api: ['*'], // Full regeneration for API docs
    security: ['authentication'],
  },
  'system-design': {
    architecture: ['architecture', 'components', 'deployment'],
    api: ['api-design'],
    'data-flow': ['data-architecture', 'pipeline'],
    dependencies: ['deployment'],
    security: ['security'],
    performance: ['reliability', 'observability'],
  },
  capacity: {
    dependencies: ['resource-requirements', 'infrastructure'],
    performance: ['performance', 'scaling', 'bottlenecks'],
    architecture: ['system-profile'],
  },
  runbook: {
    architecture: ['service-overview', 'deployment'],
    security: ['access', 'incident-response'],
    dependencies: ['configuration', 'troubleshooting'],
  },
};

/**
 * Classify a changed file by type.
 * @param {string} filePath - Relative file path
 * @returns {string} File type: source, config, infra, test, docs, other
 */
function classifyFile(filePath) {
  if (/test|spec|__tests__/i.test(filePath)) return 'test';
  if (/\.md$/i.test(filePath)) return 'docs';
  if (/Dockerfile|docker-compose|\.tf$|k8s|helm|\.github/i.test(filePath)) return 'infra';
  if (/package\.json|go\.mod|Cargo\.toml|\.env|config\./i.test(filePath)) return 'config';
  if (/\.(ts|js|py|go|rs|java|rb|cs|php|swift)$/i.test(filePath)) return 'source';
  return 'other';
}

/**
 * Map changed files to affected analysis dimensions.
 * @param {string[]} changedFiles - List of changed file paths
 * @returns {string[]} Unique affected dimension names
 */
function mapToDimensions(changedFiles) {
  const dimensions = new Set();
  for (const file of changedFiles) {
    for (const rule of IMPACT_MAP) {
      if (rule.pattern.test(file)) {
        for (const dim of rule.dimensions) dimensions.add(dim);
      }
    }
  }
  return Array.from(dimensions);
}

/**
 * Map affected dimensions to document sections.
 * @param {string[]} dimensions - Affected dimensions
 * @param {string} docType - Document type
 * @returns {string[]} Affected section names
 */
function mapToSections(dimensions, docType) {
  const mapping = DIMENSION_TO_SECTION[docType];
  if (!mapping) return ['*']; // Unknown doc type → regenerate all

  const sections = new Set();
  for (const dim of dimensions) {
    const secs = mapping[dim] || [];
    for (const s of secs) sections.add(s);
  }
  return Array.from(sections);
}

/**
 * Generate a full impact report for changed files.
 * @param {string[]} changedFiles - List of changed file paths
 * @returns {{ changedFiles: number, classification: object, dimensions: string[], documents: Array }}
 */
function generateImpactReport(changedFiles) {
  // Classify changes
  const classification = { source: 0, config: 0, infra: 0, test: 0, docs: 0, other: 0 };
  for (const file of changedFiles) {
    const type = classifyFile(file);
    classification[type]++;
  }

  // Map to dimensions
  const dimensions = mapToDimensions(changedFiles);

  // Map to document sections
  const docTypes = Object.keys(DIMENSION_TO_SECTION);
  const documents = docTypes.map((docType) => {
    const sections = mapToSections(dimensions, docType);
    const impact = sections.includes('*') ? 'critical' : sections.length > 3 ? 'high' : sections.length > 0 ? 'medium' : 'none';
    return { type: docType, sections, impact };
  }).filter((d) => d.impact !== 'none');

  return {
    changedFiles: changedFiles.length,
    classification,
    dimensions,
    documents,
  };
}

/**
 * Extract section boundaries from a Markdown document.
 * @param {string} content - Markdown content
 * @returns {Array<{header: string, level: number, start: number, end: number}>}
 */
function extractSections(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,3})\s+(.+)/);
    if (match) {
      if (currentSection) currentSection.end = i - 1;
      currentSection = {
        header: match[2].trim(),
        level: match[1].length,
        start: i,
        end: lines.length - 1,
      };
      sections.push(currentSection);
    }
  }

  return sections;
}

/**
 * Replace a section in a document with new content.
 * @param {string} content - Full document content
 * @param {string} sectionHeader - Header text to find
 * @param {string} newSectionContent - New content for the section
 * @returns {string} Updated document
 */
function replaceSection(content, sectionHeader, newSectionContent) {
  const sections = extractSections(content);
  const target = sections.find((s) =>
    s.header.toLowerCase().includes(sectionHeader.toLowerCase()),
  );

  if (!target) return content; // Section not found — return unchanged

  const lines = content.split('\n');
  const nextSection = sections.find((s) => s.start > target.start && s.level <= target.level);
  const endLine = nextSection ? nextSection.start - 1 : lines.length;

  const before = lines.slice(0, target.start);
  const after = lines.slice(endLine);
  return [...before, newSectionContent, ...after].join('\n');
}

// CLI handler
function run(args) {
  const subcommand = args[0] || 'help';

  if (subcommand === 'classify' && args[1]) {
    process.stdout.write(JSON.stringify(classifyFile(args[1])));
  } else if (subcommand === 'impact') {
    // Read file list from stdin or args
    const files = args.slice(1);
    process.stdout.write(JSON.stringify(generateImpactReport(files), null, 2));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs diff-engine <classify|impact> [files...]\n');
    process.exit(1);
  }
}

module.exports = {
  IMPACT_MAP,
  DIMENSION_TO_SECTION,
  classifyFile,
  mapToDimensions,
  mapToSections,
  generateImpactReport,
  extractSections,
  replaceSection,
  run,
};
