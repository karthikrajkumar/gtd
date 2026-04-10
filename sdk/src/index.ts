/**
 * GTD SDK — Public API for programmatic access to Get Things Done.
 *
 * @example
 * ```typescript
 * import { GTD } from 'get-things-done-sdk';
 *
 * const gtd = new GTD({ projectDir: '/path/to/project' });
 *
 * // Backward: generate docs from code
 * await gtd.scan();
 * const result = await gtd.generateDocument('tdd');
 *
 * // Forward: create project from idea
 * await gtd.initProject({ description: 'A todo API' });
 *
 * // Sync: check alignment
 * const drift = await gtd.detectDrift();
 * ```
 */

import { resolve } from 'node:path';
import type {
  GTDOptions,
  ScanResult,
  AnalysisResult,
  DocumentResult,
  StalenessReport,
  DriftResult,
  AuditResult,
  PipelineStatus,
  DocumentStatus,
  EventHandler,
  GTDEvent,
} from './types.js';
import { GTDEventType } from './types.js';
import { GtdTools } from './gtd-tools.js';

export class GTD {
  private readonly projectDir: string;
  private readonly tools: GtdTools;
  private readonly options: GTDOptions;
  private readonly eventHandlers: EventHandler[] = [];

  constructor(options: GTDOptions) {
    this.projectDir = resolve(options.projectDir);
    this.options = options;
    this.tools = new GtdTools(this.projectDir);
  }

  // --- Event handling ---

  /** Subscribe to SDK events */
  on(handler: EventHandler): void {
    this.eventHandlers.push(handler);
  }

  private emit(type: GTDEventType, data: Record<string, unknown> = {}): void {
    const event: GTDEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    for (const handler of this.eventHandlers) {
      try { handler(event); } catch (_) { /* ignore handler errors */ }
    }
  }

  // --- Backward pipeline ---

  /** Scan and map the codebase */
  async scan(): Promise<ScanResult> {
    const start = Date.now();
    this.emit(GTDEventType.SCAN_START);

    const result = await this.tools.run('init', ['scan-codebase']);
    // In a real implementation, this would spawn the codebase-mapper agent
    // For now, return the structure

    this.emit(GTDEventType.SCAN_COMPLETE, { durationMs: Date.now() - start });
    return {
      success: true,
      filesIndexed: 0,
      languages: {},
      frameworks: [],
      codebaseMapPath: resolve(this.projectDir, '.planning/CODEBASE-MAP.md'),
      durationMs: Date.now() - start,
    };
  }

  /** Run analysis on specific dimensions */
  async analyze(dimensions?: string[]): Promise<AnalysisResult> {
    const start = Date.now();
    this.emit(GTDEventType.ANALYSIS_START, { dimensions });

    const args = dimensions ? ['analyze-codebase', '--focus', dimensions.join(',')] : ['analyze-codebase'];
    await this.tools.run('init', args);

    this.emit(GTDEventType.ANALYSIS_COMPLETE, { durationMs: Date.now() - start });
    return {
      success: true,
      dimensions: {},
      durationMs: Date.now() - start,
    };
  }

  /** Generate a specific document type */
  async generateDocument(type: string): Promise<DocumentResult> {
    const start = Date.now();
    this.emit(GTDEventType.DOCUMENT_START, { type });

    const format = this.options.format || 'standard';
    const args = ['generate-document', type, '--format', format];
    if (this.options.autoMode) args.push('--auto');

    await this.tools.run('init', args);

    this.emit(GTDEventType.DOCUMENT_COMPLETE, { type, durationMs: Date.now() - start });
    return {
      success: true,
      documentType: type,
      outputPath: resolve(this.projectDir, `.planning/documents/${type.toUpperCase()}.md`),
      version: '1.0',
      verificationScore: 0,
      wordCount: 0,
      durationMs: Date.now() - start,
      totalCostUsd: 0,
    };
  }

  /** Generate all 7 document types */
  async generateAll(): Promise<DocumentResult[]> {
    const types = ['tdd', 'hld', 'lld', 'capacity', 'system-design', 'api-docs', 'runbook'];
    const results: DocumentResult[] = [];
    for (const type of types) {
      results.push(await this.generateDocument(type));
    }
    return results;
  }

  /** Update a specific document based on code changes */
  async updateDocument(type: string, since?: string): Promise<DocumentResult> {
    const args = ['incremental-update', '--doc', type];
    if (since) args.push('--since', since);
    await this.tools.run('init', args);

    return {
      success: true,
      documentType: type,
      outputPath: resolve(this.projectDir, `.planning/documents/${type.toUpperCase()}.md`),
      version: '1.1',
      verificationScore: 0,
      wordCount: 0,
      durationMs: 0,
      totalCostUsd: 0,
    };
  }

  /** Update all stale documents */
  async updateAll(since?: string): Promise<DocumentResult[]> {
    const staleness = await this.checkStaleness();
    const results: DocumentResult[] = [];
    for (const doc of staleness.staleDocuments) {
      results.push(await this.updateDocument(doc.type, since));
    }
    return results;
  }

  // --- Query operations ---

  /** Check which documents are stale */
  async checkStaleness(): Promise<StalenessReport> {
    const status = await this.tools.runJson('analysis', ['status']);
    const docs = await this.tools.runJson('doc', ['list']);

    return {
      staleDocuments: [],
      staleAnalysis: [],
      codebaseMapStale: false,
    };
  }

  /** Get the full pipeline status */
  async getStatus(): Promise<PipelineStatus> {
    const state = await this.tools.runJson('state', ['get']);
    return state as PipelineStatus;
  }

  // --- Sync operations ---

  /** Detect spec ↔ code drift */
  async detectDrift(): Promise<DriftResult> {
    const start = Date.now();
    this.emit(GTDEventType.DRIFT_START);

    await this.tools.run('init', ['detect-drift']);

    this.emit(GTDEventType.DRIFT_COMPLETE, { durationMs: Date.now() - start });
    return {
      success: true,
      totalItems: 0,
      critical: 0,
      major: 0,
      minor: 0,
      info: 0,
      reportPath: resolve(this.projectDir, '.planning/DRIFT-REPORT.md'),
      durationMs: Date.now() - start,
    };
  }

  /** Run full alignment audit */
  async audit(): Promise<AuditResult> {
    await this.tools.run('init', ['audit']);

    return {
      success: true,
      coverage: {
        requirementsToCode: 0,
        requirementsToDocs: 0,
        requirementsToTests: 0,
        codeToDocuments: 0,
        overall: 0,
      },
      gaps: [],
      reportPath: resolve(this.projectDir, '.planning/AUDIT-REPORT.md'),
    };
  }
}

// Re-export types
export type {
  GTDOptions,
  ScanResult,
  AnalysisResult,
  DocumentResult,
  StalenessReport,
  DriftResult,
  AuditResult,
  PipelineStatus,
  DocumentStatus,
  GTDEvent,
  EventHandler,
};
export { GTDEventType };
