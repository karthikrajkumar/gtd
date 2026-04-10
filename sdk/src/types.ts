/**
 * GTD SDK Type Definitions
 */

// --- Configuration ---

export interface GTDOptions {
  /** Absolute path to the project directory */
  projectDir: string;
  /** LLM model to use (default: from config) */
  model?: string;
  /** Maximum budget in USD per operation (default: 5.0) */
  maxBudgetUsd?: number;
  /** Maximum agent turns per operation (default: 50) */
  maxTurns?: number;
  /** Skip human review gates (default: false) */
  autoMode?: boolean;
  /** Document format: enterprise, standard, startup, compliance */
  format?: 'enterprise' | 'standard' | 'startup' | 'compliance';
}

// --- Results ---

export interface ScanResult {
  success: boolean;
  filesIndexed: number;
  languages: Record<string, { files: number; percentage: number }>;
  frameworks: Array<{ name: string; version?: string; confidence: number }>;
  codebaseMapPath: string;
  durationMs: number;
  error?: ErrorInfo;
}

export interface AnalysisResult {
  success: boolean;
  dimensions: Record<string, { status: string; filesAnalyzed: number }>;
  durationMs: number;
  error?: ErrorInfo;
}

export interface DocumentResult {
  success: boolean;
  documentType: string;
  outputPath: string;
  version: string;
  verificationScore: number;
  wordCount: number;
  durationMs: number;
  totalCostUsd: number;
  error?: ErrorInfo;
}

export interface StalenessReport {
  staleDocuments: Array<{
    type: string;
    lastCommit: string;
    currentCommit: string;
    changedFiles: string[];
    affectedSections: string[];
    impact: 'critical' | 'high' | 'medium' | 'low';
  }>;
  staleAnalysis: string[];
  codebaseMapStale: boolean;
}

export interface DriftResult {
  success: boolean;
  totalItems: number;
  critical: number;
  major: number;
  minor: number;
  info: number;
  reportPath: string;
  durationMs: number;
  error?: ErrorInfo;
}

export interface AuditResult {
  success: boolean;
  coverage: {
    requirementsToCode: number;
    requirementsToDocs: number;
    requirementsToTests: number;
    codeToDocuments: number;
    overall: number;
  };
  gaps: Array<{ type: string; description: string; severity: string }>;
  reportPath: string;
  error?: ErrorInfo;
}

export interface PipelineStatus {
  forward: {
    status: string;
    currentPhase: number | null;
    currentMilestone: string | null;
  };
  backward: {
    status: string;
    lastScanCommit: string | null;
    documents: Record<string, DocumentStatus>;
  };
  sync: {
    status: string;
    lastDriftCheck: string | null;
    driftItems: number;
  };
}

export interface DocumentStatus {
  status: 'pending' | 'drafting' | 'review' | 'finalized' | 'stale';
  version: string | null;
  commit: string | null;
}

export interface ErrorInfo {
  code: string;
  messages: string[];
}

// --- Events ---

export enum GTDEventType {
  SCAN_START = 'scan:start',
  SCAN_COMPLETE = 'scan:complete',
  ANALYSIS_START = 'analysis:start',
  ANALYSIS_DIMENSION = 'analysis:dimension',
  ANALYSIS_COMPLETE = 'analysis:complete',
  DOCUMENT_START = 'document:start',
  DOCUMENT_DRAFT = 'document:draft',
  DOCUMENT_VERIFIED = 'document:verified',
  DOCUMENT_COMPLETE = 'document:complete',
  DRIFT_START = 'drift:start',
  DRIFT_COMPLETE = 'drift:complete',
  ERROR = 'error',
}

export interface GTDEvent {
  type: GTDEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export type EventHandler = (event: GTDEvent) => void;
