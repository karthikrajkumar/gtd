/**
 * Tests for Phase 4: Document Generation Engine — Writer agents, templates, workflow, commands
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { PROJECT_ROOT, createTempPlanningDir, writePlanningFile, mockGitCommit } = require('./helpers.cjs');
const { parseFrontmatter } = require('../lib/frontmatter.cjs');
const { listDocuments } = require('../lib/docs.cjs');

// --- All 7 writer agents + diagram generator ---

const WRITER_AGENTS = [
  { name: 'gtd-tdd-writer', file: 'agents/backward/gtd-tdd-writer.md', output: 'TDD-DRAFT.md' },
  { name: 'gtd-hld-writer', file: 'agents/backward/gtd-hld-writer.md', output: 'HLD-DRAFT.md' },
  { name: 'gtd-lld-writer', file: 'agents/backward/gtd-lld-writer.md', output: 'LLD-DRAFT.md' },
  { name: 'gtd-capacity-writer', file: 'agents/backward/gtd-capacity-writer.md', output: 'CAPACITY-PLAN-DRAFT.md' },
  { name: 'gtd-sysdesign-writer', file: 'agents/backward/gtd-sysdesign-writer.md', output: 'SYSTEM-DESIGN-DRAFT.md' },
  { name: 'gtd-api-doc-writer', file: 'agents/backward/gtd-api-doc-writer.md', output: 'API-DOCS-DRAFT.md' },
  { name: 'gtd-runbook-writer', file: 'agents/backward/gtd-runbook-writer.md', output: 'RUNBOOK-DRAFT.md' },
];

describe('Writer Agent Definitions', () => {
  for (const agent of WRITER_AGENTS) {
    describe(agent.name, () => {
      const agentPath = path.join(PROJECT_ROOT, agent.file);

      it('exists', () => {
        expect(fs.existsSync(agentPath), `Missing: ${agent.file}`).toBe(true);
      });

      it('has valid frontmatter', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.name).toBe(agent.name);
        expect(frontmatter.category).toBe('backward');
        expect(frontmatter.role).toBe('writing');
      });

      it('uses sonnet model tier', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        const { frontmatter } = parseFrontmatter(content);
        expect(frontmatter.model_tier).toBe('sonnet');
      });

      it('has Write tool for output', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain('- Write');
      });

      it('references analysis artifacts as inputs', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain('analysis/');
      });

      it('references document-standards.md', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain('document-standards');
      });

      it('specifies output path in drafts/', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        expect(content).toContain('drafts/');
      });

      it('has quality rules about accuracy', () => {
        const content = fs.readFileSync(agentPath, 'utf8');
        // All writers must emphasize accuracy — check for key phrases
        const hasAccuracyRule = content.includes('NEVER fabricate') ||
                                content.includes('actual file') ||
                                content.includes('EVERY claim') ||
                                content.includes('never hallucinate');
        expect(hasAccuracyRule, `${agent.name} missing accuracy quality rules`).toBe(true);
      });
    });
  }
});

describe('Diagram Generator Agent', () => {
  const agentPath = path.join(PROJECT_ROOT, 'agents/backward/gtd-diagram-generator.md');

  it('exists', () => {
    expect(fs.existsSync(agentPath)).toBe(true);
  });

  it('has valid frontmatter', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.name).toBe('gtd-diagram-generator');
    expect(frontmatter.category).toBe('backward');
    expect(frontmatter.role).toBe('utility');
  });

  it('uses haiku model tier (diagrams are structured output)', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    const { frontmatter } = parseFrontmatter(content);
    expect(frontmatter.model_tier).toBe('haiku');
  });

  it('references diagram-conventions', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('diagram-conventions');
  });

  it('supports multiple diagram types', () => {
    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain('graph TD');
    expect(content).toContain('sequenceDiagram');
    expect(content).toContain('erDiagram');
  });
});

// --- Agent roster verification ---

describe('Full backward agent roster', () => {
  it('has at least 16 backward agents (mapper + analyzers + writers + diagram + verifiers)', () => {
    const agentsDir = path.join(PROJECT_ROOT, 'agents/backward');
    const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
    expect(files.length).toBeGreaterThanOrEqual(16);
  });
});

// --- Generate workflow and commands ---

describe('Generate document workflow', () => {
  const workflowPath = path.join(PROJECT_ROOT, 'workflows/backward/generate-document.md');

  it('exists', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('maps all 7 doc types to writer agents', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-tdd-writer');
    expect(content).toContain('gtd-hld-writer');
    expect(content).toContain('gtd-lld-writer');
    expect(content).toContain('gtd-capacity-writer');
    expect(content).toContain('gtd-sysdesign-writer');
    expect(content).toContain('gtd-api-doc-writer');
    expect(content).toContain('gtd-runbook-writer');
  });

  it('checks analysis prerequisites', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('stale');
    expect(content).toContain('analysis');
  });

  it('includes verification step', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('gtd-accuracy-verifier');
  });

  it('includes human review gate', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('present_for_review');
    expect(content).toContain('approved');
  });

  it('finalizes document', () => {
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('finalize');
  });
});

describe('Create-* commands', () => {
  const commands = [
    { file: 'commands/gtd/backward/create-tdd.md', name: 'gtd-create-tdd' },
    { file: 'commands/gtd/backward/create-hld.md', name: 'gtd-create-hld' },
    { file: 'commands/gtd/backward/create-lld.md', name: 'gtd-create-lld' },
    { file: 'commands/gtd/backward/create-capacity.md', name: 'gtd-create-capacity' },
    { file: 'commands/gtd/backward/create-sysdesign.md', name: 'gtd-create-sysdesign' },
    { file: 'commands/gtd/backward/create-api-docs.md', name: 'gtd-create-api-docs' },
    { file: 'commands/gtd/backward/create-runbook.md', name: 'gtd-create-runbook' },
    { file: 'commands/gtd/backward/create-all.md', name: 'gtd-create-all' },
    { file: 'commands/gtd/backward/verify-docs.md', name: 'gtd-verify-docs' },
    { file: 'commands/gtd/backward/review-docs.md', name: 'gtd-review-docs' },
    { file: 'commands/gtd/backward/doc-status.md', name: 'gtd-doc-status' },
  ];

  for (const cmd of commands) {
    it(`${cmd.name} command exists`, () => {
      const fullPath = path.join(PROJECT_ROOT, cmd.file);
      expect(fs.existsSync(fullPath), `Missing: ${cmd.file}`).toBe(true);
    });

    it(`${cmd.name} has correct frontmatter name`, () => {
      const content = fs.readFileSync(path.join(PROJECT_ROOT, cmd.file), 'utf8');
      const { frontmatter } = parseFrontmatter(content);
      expect(frontmatter.name).toBe(cmd.name);
    });
  }

  it('has 13 total backward commands (scan + analyze + 7 create + create-all + verify + review + status)', () => {
    const cmdDir = path.join(PROJECT_ROOT, 'commands/gtd/backward');
    const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    expect(files).toHaveLength(13);
  });
});

// --- Simulated document output validation ---

describe('Simulated document generation output', () => {
  let temp;

  beforeEach(() => {
    temp = createTempPlanningDir();
  });

  afterEach(() => {
    temp.cleanup();
  });

  it('validates generated TDD format', () => {
    const commit = mockGitCommit();
    writePlanningFile(temp.dir, 'drafts/TDD-DRAFT.md', `---
version: 1.0
commit: ${commit}
generated_by: GTD v0.0.1
verification: 95
---

# Technical Design Document: Todo API

**Version:** 1.0
**Date:** 2026-04-10
**Commit:** ${commit}
**Generated by:** GTD v0.0.1
**Verification:** 95% verified

---

## 1. Executive Summary

The Todo API is a REST API built with Express.js serving as a backend for a todo management application.

## 2. System Context

The system operates as a monolithic Express.js application with a PostgreSQL database managed via Prisma ORM.

## 3. Architecture Overview

Architecture follows MVC pattern with routes, models, and middleware layers.

\`\`\`mermaid
graph TD
    Client[Client] -->|HTTP/REST| Express[Express Server]
    Express --> Auth[Auth Middleware]
    Auth --> Routes[Route Handlers]
    Routes --> Models[Prisma Models]
    Models --> DB[(PostgreSQL)]
\`\`\`

## 4. Component Design

| Component | Path | Responsibility |
|-----------|------|---------------|
| Routes | src/routes/ | HTTP handling |
| Models | src/models/ | Data access |
| Middleware | src/middleware/ | Cross-cutting |
`);

    const docs = listDocuments(temp.dir);
    const tdd = docs.find((d) => d.type === 'tdd');
    expect(tdd.status).toBe('drafting');

    // Check draft content is valid
    const content = fs.readFileSync(path.join(temp.dir, 'drafts/TDD-DRAFT.md'), 'utf8');
    expect(content).toContain('## 1. Executive Summary');
    expect(content).toContain('## 3. Architecture Overview');
    expect(content).toContain('```mermaid');
    expect(content).toContain('graph TD');
  });
});
