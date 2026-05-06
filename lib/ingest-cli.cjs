'use strict';

const path = require('path');
const { findProjectRoot } = require('./file-ops.cjs');
const ingest = require('./ingest.cjs');

function run(args) {
  const [subcommand, ...rest] = args;
  const projectRoot = findProjectRoot(process.cwd());

  if (!projectRoot) {
    process.stderr.write('Error: Not inside a GTD project (.planning/ not found).\n');
    process.exit(1);
  }

  const docsRoot = path.join(projectRoot, '.planning');

  switch (subcommand) {
    case 'file': {
      const filePath = rest[0];
      if (!filePath) {
        process.stderr.write('Usage: gtd-tools.cjs ingest file <path> [--name <slug>] [--max-lines <N>]\n');
        process.exit(1);
      }

      const options = {};
      for (let i = 1; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'name') options.rename = rest[i + 1];
        if (key === 'max-lines') options.max_lines = parseInt(rest[i + 1], 10);
      }

      const result = ingest.ingestFile(path.resolve(filePath), docsRoot, options);
      process.stdout.write(JSON.stringify(result, null, 2));
      break;
    }

    case 'url': {
      const url = rest[0];
      const content = rest[1];
      if (!url || !content) {
        process.stderr.write('Usage: gtd-tools.cjs ingest url <url> <content> [--name <slug>]\n');
        process.exit(1);
      }

      const options = {};
      for (let i = 2; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'name') options.name = rest[i + 1];
      }

      const result = ingest.ingestUrl(url, content, docsRoot, options);
      process.stdout.write(JSON.stringify(result, null, 2));
      break;
    }

    case 'list': {
      const items = ingest.listIngested(docsRoot);
      process.stdout.write(JSON.stringify(items, null, 2));
      break;
    }

    default:
      process.stderr.write('Usage: gtd-tools.cjs ingest <file|url|list> [args...]\n');
      process.exit(1);
  }
}

module.exports = { run };
