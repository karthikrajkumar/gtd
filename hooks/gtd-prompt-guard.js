/**
 * GTD Prompt Guard Hook — Scans .planning/ writes for prompt injection patterns.
 *
 * Hook type: PreToolUse
 * Advisory only — warns but does not block.
 */

'use strict';

const path = require('path');
const { scanForInjection } = require('../lib/security.cjs');

module.exports = {
  event: 'PreToolUse',
  handler: (context) => {
    if (!context || !context.tool) return null;

    // Only scan Write operations to .planning/ directory
    if (context.tool !== 'Write' && context.tool !== 'Edit') return null;
    if (!context.filePath || !context.filePath.includes('.planning')) return null;

    const content = context.content || '';
    const findings = scanForInjection(content);

    if (findings.length > 0) {
      return {
        advisory: true,
        message: `⚠ GTD Prompt Guard: ${findings.length} potential injection pattern(s) detected in .planning/ write:\n` +
          findings.map((f) => `  - ${f.pattern} (line ${f.line})`).join('\n'),
      };
    }

    return null;
  },
};
