/**
 * Phase 14: SDK Tests
 *
 * Tests SDK source files exist, types are defined, CI templates present.
 * Note: Full TypeScript compilation testing requires tsc — these tests
 * verify the file structure and content patterns.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT } = require('./helpers.cjs');

const SDK_ROOT = path.join(PROJECT_ROOT, 'sdk');

// ================================================================
// SDK source files
// ================================================================

describe('SDK source files', () => {
  const REQUIRED_FILES = [
    'src/index.ts',
    'src/types.ts',
    'src/gtd-tools.ts',
    'package.json',
    'tsconfig.json',
  ];

  for (const file of REQUIRED_FILES) {
    it(`has ${file}`, () => {
      expect(fs.existsSync(path.join(SDK_ROOT, file))).toBe(true);
    });
  }
});

// ================================================================
// SDK types
// ================================================================

describe('SDK type definitions', () => {
  const typesContent = fs.readFileSync(path.join(SDK_ROOT, 'src/types.ts'), 'utf8');

  it('exports GTDOptions interface', () => {
    expect(typesContent).toContain('export interface GTDOptions');
    expect(typesContent).toContain('projectDir: string');
  });

  it('exports ScanResult interface', () => {
    expect(typesContent).toContain('export interface ScanResult');
    expect(typesContent).toContain('filesIndexed');
    expect(typesContent).toContain('frameworks');
  });

  it('exports DocumentResult interface', () => {
    expect(typesContent).toContain('export interface DocumentResult');
    expect(typesContent).toContain('documentType');
    expect(typesContent).toContain('verificationScore');
    expect(typesContent).toContain('totalCostUsd');
  });

  it('exports StalenessReport interface', () => {
    expect(typesContent).toContain('export interface StalenessReport');
    expect(typesContent).toContain('staleDocuments');
  });

  it('exports DriftResult interface', () => {
    expect(typesContent).toContain('export interface DriftResult');
    expect(typesContent).toContain('totalItems');
    expect(typesContent).toContain('critical');
  });

  it('exports AuditResult interface', () => {
    expect(typesContent).toContain('export interface AuditResult');
    expect(typesContent).toContain('coverage');
    expect(typesContent).toContain('gaps');
  });

  it('exports PipelineStatus interface', () => {
    expect(typesContent).toContain('export interface PipelineStatus');
    expect(typesContent).toContain('forward');
    expect(typesContent).toContain('backward');
    expect(typesContent).toContain('sync');
  });

  it('exports GTDEventType enum', () => {
    expect(typesContent).toContain('export enum GTDEventType');
    expect(typesContent).toContain('SCAN_START');
    expect(typesContent).toContain('DOCUMENT_COMPLETE');
    expect(typesContent).toContain('DRIFT_COMPLETE');
  });
});

// ================================================================
// SDK main class
// ================================================================

describe('SDK GTD class', () => {
  const indexContent = fs.readFileSync(path.join(SDK_ROOT, 'src/index.ts'), 'utf8');

  it('exports GTD class', () => {
    expect(indexContent).toContain('export class GTD');
  });

  it('has constructor accepting GTDOptions', () => {
    expect(indexContent).toContain('constructor(options: GTDOptions)');
  });

  // Backward methods
  it('has scan() method', () => {
    expect(indexContent).toContain('async scan(): Promise<ScanResult>');
  });

  it('has analyze() method', () => {
    expect(indexContent).toContain('async analyze(');
  });

  it('has generateDocument() method', () => {
    expect(indexContent).toContain('async generateDocument(type: string): Promise<DocumentResult>');
  });

  it('has generateAll() method', () => {
    expect(indexContent).toContain('async generateAll(): Promise<DocumentResult[]>');
  });

  it('has updateDocument() method', () => {
    expect(indexContent).toContain('async updateDocument(');
  });

  it('has updateAll() method', () => {
    expect(indexContent).toContain('async updateAll(');
  });

  // Query methods
  it('has checkStaleness() method', () => {
    expect(indexContent).toContain('async checkStaleness(): Promise<StalenessReport>');
  });

  it('has getStatus() method', () => {
    expect(indexContent).toContain('async getStatus(): Promise<PipelineStatus>');
  });

  // Sync methods
  it('has detectDrift() method', () => {
    expect(indexContent).toContain('async detectDrift(): Promise<DriftResult>');
  });

  it('has audit() method', () => {
    expect(indexContent).toContain('async audit(): Promise<AuditResult>');
  });

  // Event system
  it('has on() event handler', () => {
    expect(indexContent).toContain('on(handler: EventHandler)');
  });

  it('re-exports types', () => {
    expect(indexContent).toContain('export type');
    expect(indexContent).toContain('GTDOptions');
    expect(indexContent).toContain('DocumentResult');
    expect(indexContent).toContain('GTDEventType');
  });
});

// ================================================================
// SDK tools wrapper
// ================================================================

describe('SDK GtdTools wrapper', () => {
  const toolsContent = fs.readFileSync(path.join(SDK_ROOT, 'src/gtd-tools.ts'), 'utf8');

  it('exports GtdTools class', () => {
    expect(toolsContent).toContain('export class GtdTools');
  });

  it('has run() method', () => {
    expect(toolsContent).toContain('async run(command: string');
  });

  it('has runJson() method', () => {
    expect(toolsContent).toContain('async runJson(command: string');
  });

  it('resolves gtd-tools.cjs path', () => {
    expect(toolsContent).toContain('resolveToolsPath');
    expect(toolsContent).toContain('gtd-tools.cjs');
  });
});

// ================================================================
// SDK package.json
// ================================================================

describe('SDK package.json', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(SDK_ROOT, 'package.json'), 'utf8'));

  it('has correct name', () => {
    expect(pkg.name).toBe('get-things-done-sdk');
  });

  it('has build script', () => {
    expect(pkg.scripts.build).toContain('tsc');
  });

  it('points to dist for main', () => {
    expect(pkg.main).toContain('dist');
  });

  it('has types entry', () => {
    expect(pkg.types).toContain('.d.ts');
  });

  it('requires Node >= 20', () => {
    expect(pkg.engines.node).toBe('>=20.0.0');
  });
});

// ================================================================
// CI/CD examples
// ================================================================

describe('CI/CD examples', () => {
  const examplesDir = path.join(SDK_ROOT, 'examples');

  it('has GitHub Actions example', () => {
    expect(fs.existsSync(path.join(examplesDir, 'github-actions-docs-update.yml'))).toBe(true);
    const content = fs.readFileSync(path.join(examplesDir, 'github-actions-docs-update.yml'), 'utf8');
    expect(content).toContain('get-things-done-sdk');
    expect(content).toContain('ANTHROPIC_API_KEY');
  });

  it('has GitLab CI example', () => {
    expect(fs.existsSync(path.join(examplesDir, 'gitlab-ci-docs.yml'))).toBe(true);
    const content = fs.readFileSync(path.join(examplesDir, 'gitlab-ci-docs.yml'), 'utf8');
    expect(content).toContain('get-things-done-sdk');
  });

  it('has programmatic usage example', () => {
    expect(fs.existsSync(path.join(examplesDir, 'programmatic-usage.ts'))).toBe(true);
    const content = fs.readFileSync(path.join(examplesDir, 'programmatic-usage.ts'), 'utf8');
    expect(content).toContain('import { GTD }');
    expect(content).toContain('scan()');
    expect(content).toContain('generateDocument');
    expect(content).toContain('detectDrift');
  });
});
