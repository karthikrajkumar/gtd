/**
 * GTD Security Module — Secret scanning, prompt sanitization, path safety, error codes.
 * @module lib/security
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ================================================================
// SECRET SCANNER
// ================================================================

/**
 * Patterns that indicate potential secrets in text.
 */
const SECRET_PATTERNS = [
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/g, severity: 'critical' },
  { name: 'AWS Secret Key', pattern: /[0-9a-zA-Z/+=]{40}(?=\s|$|")/g, severity: 'critical' },
  { name: 'Private Key', pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, severity: 'critical' },
  { name: 'API Key (generic)', pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{20,}['"]?/gi, severity: 'high' },
  { name: 'Bearer Token', pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, severity: 'high' },
  { name: 'JWT Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, severity: 'high' },
  { name: 'Connection String', pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^\s'"]+/gi, severity: 'critical' },
  { name: 'Password in URL', pattern: /:\/\/[^:]+:[^@]+@/g, severity: 'critical' },
  { name: 'GitHub Token', pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/g, severity: 'critical' },
  { name: 'Slack Token', pattern: /xox[baprs]-[0-9A-Za-z\-]{10,}/g, severity: 'high' },
  { name: 'Hardcoded Password', pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"][^'"]{8,}['"]/gi, severity: 'high' },
  { name: 'Hex Secret (32+)', pattern: /(?:secret|token|key)\s*[:=]\s*['"]?[0-9a-f]{32,}['"]?/gi, severity: 'medium' },
];

/**
 * Scan text content for potential secrets.
 *
 * @param {string} content - Text to scan
 * @param {string} [source='unknown'] - Source file/description for reporting
 * @returns {Array<{pattern: string, match: string, line: number, severity: string, source: string}>}
 */
function scanForSecrets(content, source = 'unknown') {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of SECRET_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      const matches = lines[i].match(rule.pattern);
      if (matches) {
        for (const match of matches) {
          findings.push({
            pattern: rule.name,
            match: maskSecret(match),
            line: i + 1,
            severity: rule.severity,
            source,
          });
        }
      }
    }
  }

  return findings;
}

/**
 * Scan a file for secrets.
 * @param {string} filePath - File to scan
 * @returns {Array} Findings
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return scanForSecrets(content, filePath);
  } catch (_) {
    return [];
  }
}

/**
 * Mask a secret for safe display (show first/last 4 chars).
 */
function maskSecret(value) {
  if (value.length <= 8) return '***';
  return value.slice(0, 4) + '...' + value.slice(-4);
}

// ================================================================
// PROMPT SANITIZER
// ================================================================

/**
 * Patterns that indicate potential prompt injection in source code.
 */
const INJECTION_PATTERNS = [
  { name: 'System prompt override', pattern: /system\s*prompt|ignore\s*previous\s*instructions/gi },
  { name: 'Role injection', pattern: /you\s+are\s+(now\s+)?a|act\s+as\s+a/gi },
  { name: 'Instruction override', pattern: /disregard|forget\s+(all\s+)?instructions|new\s+instructions/gi },
  { name: 'Hidden instruction', pattern: /<!--\s*(?:system|admin|root|instruction)/gi },
  { name: 'Base64 encoded command', pattern: /atob\s*\(\s*['"][A-Za-z0-9+/=]{20,}['"]/g },
];

/**
 * Scan text for potential prompt injection patterns.
 * @param {string} content - Text to scan
 * @returns {Array<{pattern: string, line: number, snippet: string}>}
 */
function scanForInjection(content) {
  const findings = [];
  const lines = content.split('\n');

  for (const rule of INJECTION_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (rule.pattern.test(lines[i])) {
        findings.push({
          pattern: rule.name,
          line: i + 1,
          snippet: lines[i].trim().slice(0, 80),
        });
        rule.pattern.lastIndex = 0; // Reset regex state
      }
    }
  }

  return findings;
}

// ================================================================
// PATH SAFETY
// ================================================================

/**
 * Check if a path is safe (no traversal, no absolute escape).
 * @param {string} filePath - Path to check
 * @param {string} projectRoot - Allowed root directory
 * @returns {{ safe: boolean, reason?: string }}
 */
function isPathSafe(filePath, projectRoot) {
  const resolved = path.resolve(projectRoot, filePath);
  if (!resolved.startsWith(projectRoot)) {
    return { safe: false, reason: `Path escapes project root: ${filePath}` };
  }
  if (filePath.includes('..')) {
    return { safe: false, reason: `Path contains traversal: ${filePath}` };
  }
  return { safe: true };
}

// ================================================================
// ERROR CODES
// ================================================================

/**
 * Comprehensive GTD error codes.
 */
const ERROR_CODES = {
  // Scan errors (E001-E005)
  'GTD-E001': { category: 'SCAN', message: 'File system permission denied', recovery: 'Check file permissions, skip inaccessible files' },
  'GTD-E002': { category: 'SCAN', message: 'Max file count exceeded', recovery: 'Add exclusion patterns in /gtd-settings' },
  'GTD-E003': { category: 'ANALYSIS', message: 'Agent timeout during analysis', recovery: 'Retry with reduced scope, or increase timeout' },
  'GTD-E004': { category: 'ANALYSIS', message: 'Unsupported language detected', recovery: 'Skip unsupported dimensions, note gap' },
  'GTD-E005': { category: 'WRITE', message: 'Template not found for document type', recovery: 'Fall back to standard template' },

  // Write/verify errors (E006-E010)
  'GTD-E006': { category: 'WRITE', message: 'Required analysis artifact missing', recovery: 'Run /gtd-analyze for missing dimensions' },
  'GTD-E007': { category: 'VERIFY', message: 'Source file changed during verification', recovery: 'Re-read and re-verify' },
  'GTD-E008': { category: 'STATE', message: 'State file corrupted', recovery: 'Rebuild from analysis artifacts' },
  'GTD-E009': { category: 'GIT', message: 'Git not available', recovery: 'Proceed without versioning' },
  'GTD-E010': { category: 'CONFIG', message: 'Invalid config value', recovery: 'Use default value, warn user' },

  // Forward errors (E011-E015)
  'GTD-E011': { category: 'EXECUTION', message: 'Generated code does not compile', recovery: 'Spawn debugger, retry up to 3 times' },
  'GTD-E012': { category: 'DEPLOY', message: 'Local deployment failed', recovery: 'Check port, dependencies, build output' },
  'GTD-E013': { category: 'TEST', message: 'Test suite failure during verification', recovery: 'Spawn debugger to investigate failures' },
  'GTD-E014': { category: 'SYNC', message: 'Unresolvable drift conflict', recovery: 'Escalate to user for manual decision' },
  'GTD-E015': { category: 'SYNC', message: 'Reconciliation rejected by user', recovery: 'Preserve current state, no changes applied' },

  // Security errors (E016-E020)
  'GTD-E016': { category: 'SECURITY', message: 'Secret detected in generated document', recovery: 'Block finalization, show location, require acknowledgment' },
  'GTD-E017': { category: 'SECURITY', message: 'Prompt injection pattern detected', recovery: 'Advisory warning, continue with caution' },
  'GTD-E018': { category: 'SECURITY', message: 'Path traversal attempt', recovery: 'Block operation, report to user' },
  'GTD-E019': { category: 'BUDGET', message: 'Token budget exceeded', recovery: 'Save partial results, report cost' },
  'GTD-E020': { category: 'PIPELINE', message: 'Pipeline interrupted', recovery: 'Resume from last checkpoint in STATE.md' },
};

/**
 * Get error info by code.
 * @param {string} code - Error code (e.g., 'GTD-E016')
 * @returns {object|null}
 */
function getErrorInfo(code) {
  return ERROR_CODES[code] || null;
}

/**
 * Create a structured error.
 * @param {string} code - Error code
 * @param {string} [detail] - Additional detail
 * @returns {{ code: string, category: string, message: string, recovery: string, detail: string }}
 */
function createError(code, detail = '') {
  const info = ERROR_CODES[code];
  if (!info) return { code, category: 'UNKNOWN', message: 'Unknown error', recovery: 'Report to GTD maintainers', detail };
  return { code, ...info, detail };
}

// CLI handler
function run(args) {
  const subcommand = args[0] || 'help';

  if (subcommand === 'scan-secrets' && args[1]) {
    const findings = scanFile(args[1]);
    process.stdout.write(JSON.stringify(findings, null, 2));
  } else if (subcommand === 'scan-injection' && args[1]) {
    try {
      const content = fs.readFileSync(args[1], 'utf8');
      const findings = scanForInjection(content);
      process.stdout.write(JSON.stringify(findings, null, 2));
    } catch (e) {
      process.stderr.write(`Cannot read file: ${e.message}\n`);
      process.exit(1);
    }
  } else if (subcommand === 'error' && args[1]) {
    const info = getErrorInfo(args[1]);
    process.stdout.write(JSON.stringify(info, null, 2));
  } else if (subcommand === 'errors') {
    process.stdout.write(JSON.stringify(ERROR_CODES, null, 2));
  } else {
    process.stderr.write('Usage: gtd-tools.cjs security <scan-secrets|scan-injection|error|errors> [file|code]\n');
    process.exit(1);
  }
}

module.exports = {
  SECRET_PATTERNS,
  INJECTION_PATTERNS,
  ERROR_CODES,
  scanForSecrets,
  scanFile,
  scanForInjection,
  isPathSafe,
  getErrorInfo,
  createError,
  run,
};
