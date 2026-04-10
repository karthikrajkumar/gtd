/**
 * GTD Agent Skills Module — Lists available agent types and their tools.
 *
 * Used by workflows to discover which agents can be spawned and what
 * tools they have access to.
 *
 * @module lib/agent-skills
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('./frontmatter.cjs');

/**
 * Agent registry — all 33 agents organized by category.
 */
const AGENT_REGISTRY = {
  // Forward agents (12)
  'gtd-project-researcher': { category: 'forward', role: 'research', parallel: true },
  'gtd-phase-researcher': { category: 'forward', role: 'research', parallel: true },
  'gtd-research-synthesizer': { category: 'forward', role: 'research', parallel: false },
  'gtd-roadmapper': { category: 'forward', role: 'planning', parallel: false },
  'gtd-planner': { category: 'forward', role: 'planning', parallel: false },
  'gtd-plan-checker': { category: 'forward', role: 'verification', parallel: false },
  'gtd-executor': { category: 'forward', role: 'execution', parallel: true },
  'gtd-verifier': { category: 'forward', role: 'verification', parallel: false },
  'gtd-deployer': { category: 'forward', role: 'deploy', parallel: false },
  'gtd-test-runner': { category: 'forward', role: 'testing', parallel: false },
  'gtd-debugger': { category: 'forward', role: 'debug', parallel: false },
  'gtd-code-reviewer': { category: 'forward', role: 'review', parallel: false },

  // Backward agents (18)
  'gtd-codebase-mapper': { category: 'backward', role: 'discovery', parallel: false },
  'gtd-architecture-analyzer': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-api-extractor': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-pattern-detector': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-data-flow-tracer': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-dependency-analyzer': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-security-scanner': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-performance-profiler': { category: 'backward', role: 'analysis', parallel: true },
  'gtd-tdd-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-hld-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-lld-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-capacity-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-sysdesign-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-api-doc-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-runbook-writer': { category: 'backward', role: 'writing', parallel: false },
  'gtd-accuracy-verifier': { category: 'backward', role: 'verification', parallel: false },
  'gtd-completeness-auditor': { category: 'backward', role: 'verification', parallel: false },
  'gtd-diagram-generator': { category: 'backward', role: 'utility', parallel: false },

  // Sync agents (3)
  'gtd-drift-detector': { category: 'sync', role: 'sync', parallel: false },
  'gtd-reconciliation-planner': { category: 'sync', role: 'sync', parallel: false },
  'gtd-alignment-auditor': { category: 'sync', role: 'sync', parallel: false },
};

/**
 * Get agent info from the registry.
 *
 * @param {string} agentName - Agent identifier (e.g., 'gtd-executor')
 * @returns {object|null} Agent info or null
 */
function getAgentInfo(agentName) {
  return AGENT_REGISTRY[agentName] || null;
}

/**
 * List all agents, optionally filtered by category.
 *
 * @param {string} [category] - 'forward', 'backward', or 'sync'
 * @returns {string[]} Agent names
 */
function listAgents(category) {
  return Object.entries(AGENT_REGISTRY)
    .filter(([_, info]) => !category || info.category === category)
    .map(([name, _]) => name);
}

/**
 * Try to load an agent definition file and extract its frontmatter.
 *
 * @param {string} agentName - Agent identifier
 * @param {string} agentsDir - Path to agents/ directory
 * @returns {object|null} Agent definition or null
 */
function loadAgentDefinition(agentName, agentsDir) {
  const info = AGENT_REGISTRY[agentName];
  if (!info) return null;

  const agentFile = path.join(agentsDir, info.category, `${agentName}.md`);
  if (!fs.existsSync(agentFile)) return null;

  try {
    const content = fs.readFileSync(agentFile, 'utf8');
    const { frontmatter, body } = parseFrontmatter(content);
    return { ...frontmatter, ...info, body_length: body.length };
  } catch (_) {
    return null;
  }
}

// CLI handler
function run(args) {
  const agentName = args[0];

  if (!agentName) {
    // List all agents
    process.stdout.write(JSON.stringify(AGENT_REGISTRY, null, 2));
    return;
  }

  const info = getAgentInfo(agentName);
  if (!info) {
    process.stderr.write(`Unknown agent: ${agentName}\n`);
    process.exit(1);
  }

  process.stdout.write(JSON.stringify({ name: agentName, ...info }, null, 2));
}

module.exports = {
  AGENT_REGISTRY,
  getAgentInfo,
  listAgents,
  loadAgentDefinition,
  run,
};
