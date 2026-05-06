'use strict';

const path = require('path');
const { findProjectRoot } = require('./file-ops.cjs');
const session = require('./session.cjs');

function run(args) {
  const [subcommand, ...rest] = args;
  const projectRoot = findProjectRoot(process.cwd());

  if (!projectRoot) {
    process.stderr.write('Error: Not inside a GTD project (.planning/ not found).\n');
    process.exit(1);
  }

  const docsRoot = path.join(projectRoot, '.planning');

  switch (subcommand) {
    case 'pause': {
      const data = {};
      for (let i = 0; i < rest.length; i += 2) {
        const key = rest[i].replace(/^--/, '');
        data[key] = rest[i + 1] || '';
      }
      const handoff = session.createHandoff(docsRoot, {
        phase: data.phase || null,
        step: data.step || null,
        plan_index: data.plan_index ? parseInt(data.plan_index, 10) : null,
        context_summary: data.summary || '',
        next_action: data.next || '',
        decisions: data.decisions ? data.decisions.split('|') : [],
        blockers: data.blockers ? data.blockers.split('|') : [],
        files_modified: data.files ? data.files.split('|') : [],
        git_branch: data.branch || null,
        git_commit: data.commit || null,
      });
      process.stdout.write(JSON.stringify(handoff, null, 2));
      break;
    }

    case 'load': {
      const handoff = session.loadHandoff(docsRoot);
      if (!handoff) {
        process.stderr.write('No HANDOFF.json found.\n');
        process.exit(1);
      }
      process.stdout.write(JSON.stringify(handoff, null, 2));
      break;
    }

    case 'has': {
      process.stdout.write(session.hasHandoff(docsRoot) ? 'true' : 'false');
      break;
    }

    case 'archive': {
      const archived = session.archiveHandoff(docsRoot);
      if (archived) {
        process.stdout.write(`Archived to: ${archived}\n`);
      } else {
        process.stderr.write('No HANDOFF.json to archive.\n');
        process.exit(1);
      }
      break;
    }

    case 'report': {
      const report = session.generateSessionReport(docsRoot);
      if (!report) {
        process.stderr.write('No session data found.\n');
        process.exit(1);
      }
      process.stdout.write(report);
      break;
    }

    default:
      process.stderr.write(
        'Usage: gtd-tools.cjs session <pause|load|has|archive|report> [args...]\n',
      );
      process.exit(1);
  }
}

module.exports = { run };
