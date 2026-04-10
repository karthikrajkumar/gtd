/**
 * Phase 13: Incremental Updates — Diff Engine Tests
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT } = require('./helpers.cjs');
const {
  classifyFile,
  mapToDimensions,
  mapToSections,
  generateImpactReport,
  extractSections,
  replaceSection,
} = require('../lib/diff-engine.cjs');

// ================================================================
// classifyFile
// ================================================================

describe('classifyFile', () => {
  it('classifies TypeScript source', () => {
    expect(classifyFile('src/app.ts')).toBe('source');
    expect(classifyFile('src/routes/auth.js')).toBe('source');
    expect(classifyFile('main.py')).toBe('source');
    expect(classifyFile('cmd/server/main.go')).toBe('source');
  });

  it('classifies test files', () => {
    expect(classifyFile('tests/auth.test.ts')).toBe('test');
    expect(classifyFile('src/__tests__/utils.spec.js')).toBe('test');
    expect(classifyFile('test_auth.py')).toBe('test');
  });

  it('classifies config files', () => {
    expect(classifyFile('package.json')).toBe('config');
    expect(classifyFile('go.mod')).toBe('config');
    expect(classifyFile('.env')).toBe('config');
  });

  it('classifies infrastructure files', () => {
    expect(classifyFile('Dockerfile')).toBe('infra');
    expect(classifyFile('docker-compose.yml')).toBe('infra');
    expect(classifyFile('main.tf')).toBe('infra');
    expect(classifyFile('.github/workflows/ci.yml')).toBe('infra');
    expect(classifyFile('k8s/deployment.yaml')).toBe('infra');
  });

  it('classifies documentation files', () => {
    expect(classifyFile('README.md')).toBe('docs');
    expect(classifyFile('docs/guide.md')).toBe('docs');
  });
});

// ================================================================
// mapToDimensions
// ================================================================

describe('mapToDimensions', () => {
  it('maps source files to architecture + data-flow + performance', () => {
    const dims = mapToDimensions(['src/app.ts']);
    expect(dims).toContain('architecture');
    expect(dims).toContain('data-flow');
    expect(dims).toContain('performance');
  });

  it('maps route files to api dimension', () => {
    const dims = mapToDimensions(['src/routes/auth.js']);
    expect(dims).toContain('api');
  });

  it('maps auth files to security dimension', () => {
    const dims = mapToDimensions(['src/middleware/auth.js']);
    expect(dims).toContain('security');
  });

  it('maps package.json to dependencies', () => {
    const dims = mapToDimensions(['package.json']);
    expect(dims).toContain('dependencies');
  });

  it('maps Dockerfile to architecture', () => {
    const dims = mapToDimensions(['Dockerfile']);
    expect(dims).toContain('architecture');
  });

  it('maps prisma files to data-flow + dependencies', () => {
    const dims = mapToDimensions(['prisma/schema.prisma']);
    expect(dims).toContain('data-flow');
    expect(dims).toContain('dependencies');
  });

  it('deduplicates dimensions', () => {
    const dims = mapToDimensions(['src/app.ts', 'src/server.ts']);
    const unique = new Set(dims);
    expect(unique.size).toBe(dims.length);
  });
});

// ================================================================
// mapToSections
// ================================================================

describe('mapToSections', () => {
  it('maps architecture dimension to TDD sections', () => {
    const sections = mapToSections(['architecture'], 'tdd');
    expect(sections).toContain('architecture-overview');
    expect(sections).toContain('component-design');
  });

  it('maps api dimension to TDD api-design section', () => {
    const sections = mapToSections(['api'], 'tdd');
    expect(sections).toContain('api-design');
  });

  it('maps api dimension to api-docs with full regen', () => {
    const sections = mapToSections(['api'], 'api-docs');
    expect(sections).toContain('*');
  });

  it('returns * for unknown doc type', () => {
    const sections = mapToSections(['architecture'], 'unknown-doc');
    expect(sections).toContain('*');
  });
});

// ================================================================
// generateImpactReport
// ================================================================

describe('generateImpactReport', () => {
  it('generates complete impact report', () => {
    const report = generateImpactReport([
      'src/routes/auth.js',
      'src/models/user.ts',
      'package.json',
      'Dockerfile',
    ]);

    expect(report.changedFiles).toBe(4);
    expect(report.classification.source).toBeGreaterThanOrEqual(1);
    expect(report.dimensions.length).toBeGreaterThan(0);
    expect(report.documents.length).toBeGreaterThan(0);
  });

  it('includes impact level per document', () => {
    const report = generateImpactReport(['src/routes/todos.js']);
    for (const doc of report.documents) {
      expect(['critical', 'high', 'medium']).toContain(doc.impact);
      expect(doc.sections.length).toBeGreaterThan(0);
    }
  });

  it('handles empty file list', () => {
    const report = generateImpactReport([]);
    expect(report.changedFiles).toBe(0);
    expect(report.dimensions).toHaveLength(0);
    expect(report.documents).toHaveLength(0);
  });
});

// ================================================================
// extractSections
// ================================================================

describe('extractSections', () => {
  it('extracts sections from Markdown', () => {
    const content = `# Title

## Section 1
Content 1

## Section 2
Content 2

### Subsection 2.1
Sub content

## Section 3
Content 3`;

    const sections = extractSections(content);
    expect(sections.length).toBeGreaterThanOrEqual(4);
    expect(sections[0].header).toBe('Title');
    expect(sections[1].header).toBe('Section 1');
    expect(sections[2].header).toBe('Section 2');
  });

  it('tracks line numbers', () => {
    const content = `# Title\n\n## Section 1\nLine A\nLine B\n\n## Section 2\nLine C`;
    const sections = extractSections(content);
    expect(sections[0].start).toBe(0);
    expect(sections[1].start).toBe(2);
    expect(sections[2].start).toBe(6);
  });
});

// ================================================================
// replaceSection
// ================================================================

describe('replaceSection', () => {
  const DOC = `# Document

## Architecture
Old architecture content.
More old content.

## API Design
API content stays.

## Dependencies
Dep content stays.`;

  it('replaces a section by header', () => {
    const result = replaceSection(DOC, 'Architecture', '## Architecture\nNew architecture content.');
    expect(result).toContain('New architecture content');
    expect(result).not.toContain('Old architecture content');
    expect(result).toContain('API content stays');
  });

  it('preserves other sections', () => {
    const result = replaceSection(DOC, 'Architecture', '## Architecture\nUpdated.');
    expect(result).toContain('API content stays');
    expect(result).toContain('Dep content stays');
  });

  it('returns unchanged when section not found', () => {
    const result = replaceSection(DOC, 'Nonexistent Section', 'New content');
    expect(result).toBe(DOC);
  });

  it('handles case-insensitive matching', () => {
    const result = replaceSection(DOC, 'architecture', '## Architecture\nUpdated.');
    expect(result).toContain('Updated.');
  });
});

// ================================================================
// Incremental update workflow
// ================================================================

describe('Incremental update workflow', () => {
  it('exists', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'workflows/backward/incremental-update.md'))).toBe(true);
  });

  it('references diff-engine for impact analysis', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'workflows/backward/incremental-update.md'), 'utf8'
    );
    expect(content).toContain('diff-engine');
    expect(content).toContain('impact');
  });

  it('supports --since flag', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'workflows/backward/incremental-update.md'), 'utf8'
    );
    expect(content).toContain('--since');
  });

  it('supports --doc flag for targeted update', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'workflows/backward/incremental-update.md'), 'utf8'
    );
    expect(content).toContain('--doc');
  });

  it('archives current version before patching', () => {
    const content = fs.readFileSync(
      path.join(PROJECT_ROOT, 'workflows/backward/incremental-update.md'), 'utf8'
    );
    expect(content.toLowerCase()).toContain('archive');
    expect(content.toLowerCase()).toContain('history');
  });
});

// ================================================================
// Backward workflow count update
// ================================================================

describe('Backward workflows after Phase 13', () => {
  it('has 7 backward workflows', () => {
    const dir = path.join(PROJECT_ROOT, 'workflows/backward');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(7);
  });
});
