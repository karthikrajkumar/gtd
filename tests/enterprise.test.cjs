/**
 * Phase 16: Enterprise Features Tests
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PROJECT_ROOT, createTempPlanningDir, writePlanningFile } = require('./helpers.cjs');
const { TIERS, detectTier, detectTierFromProject, getAdaptiveConfig, needsDecomposition } = require('../lib/scale-adapter.cjs');
const { resolveTemplate, listTemplates, validateTemplate } = require('../lib/template.cjs');

// ================================================================
// Scale-Adaptive Intelligence
// ================================================================

describe('Scale Adapter — Tier Detection', () => {
  it('has 5 tiers', () => {
    expect(Object.keys(TIERS)).toHaveLength(5);
    expect(TIERS).toHaveProperty('micro');
    expect(TIERS).toHaveProperty('small');
    expect(TIERS).toHaveProperty('medium');
    expect(TIERS).toHaveProperty('large');
    expect(TIERS).toHaveProperty('enterprise');
  });

  it('detects micro tier (1-5 files)', () => {
    expect(detectTier(3).tier).toBe('micro');
    expect(detectTier(5).tier).toBe('micro');
  });

  it('detects small tier (6-50 files)', () => {
    expect(detectTier(20).tier).toBe('small');
    expect(detectTier(50).tier).toBe('small');
  });

  it('detects medium tier (51-500 files)', () => {
    expect(detectTier(100).tier).toBe('medium');
    expect(detectTier(500).tier).toBe('medium');
  });

  it('detects large tier (501-5000 files)', () => {
    expect(detectTier(1000).tier).toBe('large');
    expect(detectTier(5000).tier).toBe('large');
  });

  it('detects enterprise tier (5001+ files)', () => {
    expect(detectTier(10000).tier).toBe('enterprise');
    expect(detectTier(50000).tier).toBe('enterprise');
  });
});

describe('Scale Adapter — Tier Config', () => {
  it('micro uses shallow analysis and combined docs', () => {
    const config = TIERS.micro;
    expect(config.analysisDepth).toBe('shallow');
    expect(config.docStrategy).toBe('combined');
    expect(config.parallelAnalyzers).toBe(1);
  });

  it('medium uses standard analysis and full docs', () => {
    const config = TIERS.medium;
    expect(config.analysisDepth).toBe('standard');
    expect(config.docStrategy).toBe('full');
    expect(config.parallelAnalyzers).toBe(6);
  });

  it('enterprise uses deep analysis and service-level docs', () => {
    const config = TIERS.enterprise;
    expect(config.analysisDepth).toBe('deep');
    expect(config.docStrategy).toBe('service-level');
    expect(config.parallelAnalyzers).toBe(7);
  });
});

describe('Scale Adapter — Project Detection', () => {
  let temp;
  beforeEach(() => { temp = createTempPlanningDir(); });
  afterEach(() => { temp.cleanup(); });

  it('detects from FILE-INDEX.json', () => {
    writePlanningFile(temp.dir, 'analysis/FILE-INDEX.json',
      JSON.stringify({ version: '1.0', stats: { total_files: 234 } }));
    const result = detectTierFromProject(temp.dir);
    expect(result.tier).toBe('medium');
    expect(result.fileCount).toBe(234);
  });

  it('detects from CODEBASE-MAP.md frontmatter', () => {
    writePlanningFile(temp.dir, 'CODEBASE-MAP.md',
      '---\nfiles_indexed: 15\n---\n# Map');
    const result = detectTierFromProject(temp.dir);
    expect(result.tier).toBe('small');
    expect(result.fileCount).toBe(15);
  });

  it('defaults to medium when no data available', () => {
    const result = detectTierFromProject(temp.dir);
    expect(result.tier).toBe('medium');
  });
});

describe('Scale Adapter — Adaptive Config', () => {
  it('returns config overrides for each tier', () => {
    for (const tier of Object.keys(TIERS)) {
      const config = getAdaptiveConfig(tier);
      expect(config).toHaveProperty('scan');
      expect(config).toHaveProperty('analysis');
      expect(config).toHaveProperty('workflow');
      expect(config).toHaveProperty('documents');
    }
  });
});

describe('Scale Adapter — Decomposition', () => {
  it('large and enterprise need decomposition', () => {
    expect(needsDecomposition('large')).toBe(true);
    expect(needsDecomposition('enterprise')).toBe(true);
  });

  it('micro/small/medium do not need decomposition', () => {
    expect(needsDecomposition('micro')).toBe(false);
    expect(needsDecomposition('small')).toBe(false);
    expect(needsDecomposition('medium')).toBe(false);
  });
});

// ================================================================
// Compliance Templates
// ================================================================

describe('Compliance template pack', () => {
  it('compliance TDD template exists', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it('compliance template has 18 sections', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    const content = fs.readFileSync(resolved, 'utf8');
    // Count ## headers
    const sections = content.match(/^## \d+\./gm);
    expect(sections.length).toBe(18);
  });

  it('compliance template includes SOC2 controls', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    const content = fs.readFileSync(resolved, 'utf8');
    expect(content).toContain('SOC 2');
    expect(content).toContain('Controls');
  });

  it('compliance template includes ISO 27001', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    const content = fs.readFileSync(resolved, 'utf8');
    expect(content).toContain('ISO 27001');
  });

  it('compliance template includes data classification', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    const content = fs.readFileSync(resolved, 'utf8');
    expect(content).toContain('Data Classification');
  });

  it('compliance template includes audit logging', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    const content = fs.readFileSync(resolved, 'utf8');
    expect(content).toContain('Audit');
  });

  it('compliance template validates successfully', () => {
    const resolved = resolveTemplate('tdd', 'compliance');
    const content = fs.readFileSync(resolved, 'utf8');
    const result = validateTemplate(content);
    expect(result.valid).toBe(true);
  });
});

describe('Startup template', () => {
  it('startup TDD template exists', () => {
    const resolved = resolveTemplate('tdd', 'startup');
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it('startup template is concise (7 sections)', () => {
    const resolved = resolveTemplate('tdd', 'startup');
    const content = fs.readFileSync(resolved, 'utf8');
    const sections = content.match(/^## /gm);
    expect(sections.length).toBe(7);
  });

  it('startup template validates', () => {
    const resolved = resolveTemplate('tdd', 'startup');
    const content = fs.readFileSync(resolved, 'utf8');
    expect(validateTemplate(content).valid).toBe(true);
  });
});

// ================================================================
// Template Format Variants — All 4 formats for TDD
// ================================================================

describe('TDD has all 4 format variants', () => {
  const formats = ['standard', 'enterprise', 'compliance', 'startup'];

  for (const format of formats) {
    it(`resolves ${format} format`, () => {
      const resolved = resolveTemplate('tdd', format);
      expect(fs.existsSync(resolved)).toBe(true);
    });
  }

  it('formats have increasing section counts', () => {
    const sectionCounts = {};
    for (const format of formats) {
      const content = fs.readFileSync(resolveTemplate('tdd', format), 'utf8');
      const sections = content.match(/^## /gm) || [];
      sectionCounts[format] = sections.length;
    }
    // Startup < Standard < Enterprise < Compliance
    expect(sectionCounts.startup).toBeLessThan(sectionCounts.standard);
    expect(sectionCounts.standard).toBeLessThanOrEqual(sectionCounts.enterprise);
    expect(sectionCounts.enterprise).toBeLessThanOrEqual(sectionCounts.compliance);
  });
});

// ================================================================
// Compliance guide
// ================================================================

describe('Compliance format guide', () => {
  it('exists', () => {
    expect(fs.existsSync(path.join(PROJECT_ROOT, 'templates/backward/formats/compliance-guide.md'))).toBe(true);
  });

  it('documents SOC 2 trust service criteria', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'templates/backward/formats/compliance-guide.md'), 'utf8');
    expect(content).toContain('SOC 2');
    expect(content).toContain('Security');
    expect(content).toContain('Availability');
  });

  it('documents ISO 27001 Annex A controls', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'templates/backward/formats/compliance-guide.md'), 'utf8');
    expect(content).toContain('Annex A');
    expect(content).toContain('A.8');
    expect(content).toContain('A.9');
  });
});

// ================================================================
// CLI integration
// ================================================================

describe('Scale CLI tools', () => {
  it('scale detect works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" scale detect`,
      { encoding: 'utf8' }
    ).trim();
    const info = JSON.parse(result);
    expect(info).toHaveProperty('tier');
    expect(info).toHaveProperty('config');
  });

  it('scale tiers works', () => {
    const result = execSync(
      `node "${path.join(PROJECT_ROOT, 'bin/gtd-tools.cjs')}" scale tiers`,
      { encoding: 'utf8' }
    ).trim();
    const tiers = JSON.parse(result);
    expect(tiers).toHaveLength(5);
  });
});
