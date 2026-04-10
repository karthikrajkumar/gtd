#!/usr/bin/env node

/**
 * GTD CLI Tools — Runtime utility layer for Get Things Done.
 *
 * Called by workflows and agents to manage state, config, analysis cache,
 * templates, documents, phases, roadmaps, deployment, and drift detection.
 *
 * Usage:
 *   node gtd-tools.cjs <command> [args...]
 *
 * Commands:
 *   init <workflow> [args]     — Assemble workflow context
 *   config-get <key>           — Get config value (dot notation)
 *   config-set <key> <value>   — Set config value
 *   state [subcommand]         — State operations
 *   analysis [subcommand]      — Analysis cache operations
 *   template <subcommand>      — Template operations
 *   doc <subcommand>           — Document management
 *   phase <subcommand>         — Phase management (forward)
 *   roadmap <subcommand>       — Roadmap operations (forward)
 *   deploy <subcommand>        — Deploy operations (forward)
 *   drift <subcommand>         — Drift detection (sync)
 *   test <subcommand>          — Test execution (forward)
 *   version                    — Show version
 */

'use strict';

const path = require('path');

// Command registry — modules loaded lazily
const COMMANDS = {
  init: () => require('../lib/init.cjs'),
  'config-get': () => require('../lib/config.cjs').get,
  'config-set': () => require('../lib/config.cjs').set,
  state: () => require('../lib/state.cjs'),
  analysis: () => require('../lib/analysis.cjs'),
  'agent-skills': () => require('../lib/agent-skills.cjs'),
  template: () => require('../lib/template.cjs'),
  doc: () => require('../lib/docs.cjs'),
  phase: () => require('../lib/phase.cjs'),
  roadmap: () => require('../lib/roadmap.cjs'),
  deploy: () => require('../lib/deploy.cjs'),
  drift: () => require('../lib/drift-engine.cjs'),
  'diff-engine': () => require('../lib/diff-engine.cjs'),
  test: () => require('../lib/test-runner.cjs'),
  security: () => require('../lib/security.cjs'),
  scale: () => require('../lib/scale-adapter.cjs'),
  version: () => {
    const pkg = require('../package.json');
    process.stdout.write(pkg.version);
    return { run: () => {} };
  },
};

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    process.stderr.write(
      'Usage: gtd-tools.cjs <command> [args...]\n' +
        'Commands: ' +
        Object.keys(COMMANDS).join(', ') +
        '\n',
    );
    process.exit(1);
  }

  if (!COMMANDS[command]) {
    process.stderr.write(`Unknown command: ${command}\n`);
    process.stderr.write('Available: ' + Object.keys(COMMANDS).join(', ') + '\n');
    process.exit(1);
  }

  try {
    const handler = COMMANDS[command]();
    if (typeof handler === 'function') {
      handler(args);
    } else if (handler && typeof handler.run === 'function') {
      handler.run(args);
    }
  } catch (err) {
    process.stderr.write(`Error [${command}]: ${err.message}\n`);
    process.exit(1);
  }
}

main();
