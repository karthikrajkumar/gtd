/**
 * GTD Check Update Hook — Background check for new GTD versions.
 *
 * Hook type: SessionStart
 * Runs once per session, non-blocking.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

module.exports = {
  event: 'SessionStart',
  handler: () => {
    try {
      const currentVersion = require('../package.json').version;

      // Non-blocking check against npm registry
      const latest = execSync('npm view get-things-done version 2>/dev/null', {
        encoding: 'utf8',
        timeout: 5000,
      }).trim();

      if (latest && latest !== currentVersion) {
        return {
          advisory: true,
          message: `GTD update available: v${currentVersion} → v${latest}. Run: npx get-things-done@latest`,
        };
      }
    } catch (_) {
      // Silently fail — no network or npm not available
    }

    return null;
  },
};
