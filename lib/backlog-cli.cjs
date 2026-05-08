'use strict';

const path = require('path');
const { findProjectRoot } = require('./file-ops.cjs');
const backlog = require('./backlog.cjs');

function run(args) {
  const [subcommand, ...rest] = args;
  const projectRoot = findProjectRoot(process.cwd());

  if (!projectRoot) {
    process.stderr.write('Error: Not inside a GTD project (.planning/ not found).\n');
    process.exit(1);
  }

  const docsRoot = path.join(projectRoot, '.planning');

  switch (subcommand) {
    case 'add': {
      const title = rest[0];
      if (!title) {
        process.stderr.write('Usage: gtd-tools.cjs backlog add "<title>" [--priority <p>] [--tags <t>]\n');
        process.exit(1);
      }
      const options = {};
      for (let i = 1; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'priority') options.priority = rest[i + 1];
        if (key === 'tags') options.tags = (rest[i + 1] || '').split(',');
      }
      const entry = backlog.addBacklogItem(docsRoot, { title, ...options });
      process.stdout.write(JSON.stringify(entry, null, 2));
      break;
    }

    case 'list': {
      const filters = {};
      for (let i = 0; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'status') filters.status = rest[i + 1];
        if (key === 'priority') filters.priority = rest[i + 1];
        if (key === 'tag') filters.tag = rest[i + 1];
      }
      const items = backlog.listBacklog(docsRoot, filters);
      process.stdout.write(JSON.stringify(items, null, 2));
      break;
    }

    case 'plant-seed': {
      const idea = rest[0];
      if (!idea) {
        process.stderr.write('Usage: gtd-tools.cjs backlog plant-seed "<idea>" [--trigger "<t>"]\n');
        process.exit(1);
      }
      const options = {};
      for (let i = 1; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'trigger') options.trigger = rest[i + 1];
        if (key === 'context') options.context = rest[i + 1];
      }
      const seed = backlog.plantSeed(docsRoot, { idea, ...options });
      process.stdout.write(JSON.stringify(seed, null, 2));
      break;
    }

    case 'list-seeds': {
      const seeds = backlog.listSeeds(docsRoot);
      process.stdout.write(JSON.stringify(seeds, null, 2));
      break;
    }

    case 'create-thread': {
      const options = {};
      for (let i = 0; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'name') options.name = rest[i + 1];
        if (key === 'description') options.description = rest[i + 1];
      }
      if (!options.name) {
        process.stderr.write('Usage: gtd-tools.cjs backlog create-thread --name "<n>" [--description "<d>"]\n');
        process.exit(1);
      }
      const thread = backlog.createThread(docsRoot, options);
      process.stdout.write(JSON.stringify(thread, null, 2));
      break;
    }

    case 'append-thread': {
      const options = {};
      for (let i = 0; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        if (key === 'slug') options.slug = rest[i + 1];
        if (key === 'content') options.content = rest[i + 1];
      }
      if (!options.slug || !options.content) {
        process.stderr.write('Usage: gtd-tools.cjs backlog append-thread --slug <s> --content "<c>"\n');
        process.exit(1);
      }
      const ok = backlog.appendToThread(docsRoot, options.slug, options.content);
      process.stdout.write(ok ? 'ok' : 'error: thread not found');
      if (!ok) process.exit(1);
      break;
    }

    case 'list-threads': {
      const threads = backlog.listThreads(docsRoot);
      process.stdout.write(JSON.stringify(threads, null, 2));
      break;
    }

    default:
      process.stderr.write(
        'Usage: gtd-tools.cjs backlog <add|list|plant-seed|list-seeds|create-thread|append-thread|list-threads> [args...]\n',
      );
      process.exit(1);
  }
}

module.exports = { run };
