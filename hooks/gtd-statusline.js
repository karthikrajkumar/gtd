/**
 * GTD Status Line Hook — Displays pipeline status in the IDE status bar.
 *
 * Hook type: statusLine
 * Runtime: Claude Code (compatible with statusLine event)
 */

'use strict';

const path = require('path');

module.exports = {
  event: 'statusLine',
  handler: () => {
    try {
      const gtdTools = path.join(__dirname, '..', 'bin', 'gtd-tools.cjs');
      const { execSync } = require('child_process');
      const state = JSON.parse(
        execSync(`node "${gtdTools}" state pipeline`, { encoding: 'utf8', timeout: 3000 })
      );

      const parts = ['GTD'];
      if (state.forward !== 'empty') parts.push(`F:${state.forward}`);
      if (state.backward !== 'empty') parts.push(`B:${state.backward}`);
      if (state.sync === 'drifted') parts.push('⚠DRIFT');

      return parts.join(' | ');
    } catch (_) {
      return 'GTD';
    }
  },
};
