/**
 * File routes — Browse files inside a sandbox.
 *
 * Proxies find/cat commands to the sandbox via the sandbox service exec endpoint.
 */

import type { FastifyInstance } from 'fastify';
import type { SandboxClient } from '../sandbox/sandbox-client.js';
import { sessionStore } from '../session/session-store.js';

export interface FileRouteDeps {
  sandboxClient: SandboxClient;
}

export async function fileRoutes(
  app: FastifyInstance,
  deps: FileRouteDeps,
): Promise<void> {
  const { sandboxClient } = deps;

  /**
   * GET /api/sessions/:id/files
   *
   * Lists all files in the workspace (excluding node_modules and .git).
   * .planning/ is included so users see GTD-generated artifacts.
   */
  app.get('/api/sessions/:id/files', async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = sessionStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    try {
      const result = await sandboxClient.exec(session.sandboxId, [
        'find', '/workspace', '-type', 'f',
        '-not', '-path', '*/node_modules/*',
        '-not', '-path', '*/.git/*',
      ]);

      if (result.exitCode !== 0) {
        return reply.status(500).send({ error: 'Failed to list files', detail: result.stderr });
      }

      const files = result.stdout
        .split('\n')
        .filter(Boolean)
        .map((f) => f.replace('/workspace/', ''))
        .sort();

      // Update session file tree
      session.fileTree = files;

      // Build tree structure
      const tree = buildTree(files);

      return reply.send({ files, tree });
    } catch (err: unknown) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/sessions/:id/files/*
   *
   * Read a specific file's content.
   */
  app.get('/api/sessions/:id/files/*', async (req, reply) => {
    const { id } = req.params as { id: string };
    const filePath = (req.params as { '*': string })['*'];

    if (!filePath) return reply.status(400).send({ error: 'File path required' });

    const session = sessionStore.get(id);
    if (!session) return reply.status(404).send({ error: 'Session not found' });

    // Security: prevent path traversal
    if (filePath.includes('..')) {
      return reply.status(400).send({ error: 'Invalid file path' });
    }

    try {
      const result = await sandboxClient.exec(session.sandboxId, [
        'cat', `/workspace/${filePath}`,
      ]);

      if (result.exitCode !== 0) {
        return reply.status(404).send({ error: 'File not found', detail: result.stderr });
      }

      // Detect language from extension
      const ext = filePath.split('.').pop() ?? '';
      const language = extToLanguage(ext);

      return reply.send({
        path: filePath,
        content: result.stdout,
        language,
      });
    } catch (err: unknown) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
}

/** Build a nested tree structure from flat file paths */
export function buildTree(files: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isFile = i === parts.length - 1;

      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = {
          name,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'directory',
          children: isFile ? undefined : [],
        };
        current.push(existing);
      }

      if (!isFile && existing.children) {
        current = existing.children;
      }
    }
  }

  return sortTree(root);
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

function sortTree(nodes: TreeNode[]): TreeNode[] {
  return nodes
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((n) => ({
      ...n,
      children: n.children ? sortTree(n.children) : undefined,
    }));
}

function extToLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
    json: 'json', md: 'markdown', css: 'css', scss: 'scss', html: 'html',
    py: 'python', rs: 'rust', go: 'go', yaml: 'yaml', yml: 'yaml',
    toml: 'toml', sh: 'shell', bash: 'shell', sql: 'sql',
    dockerfile: 'dockerfile', xml: 'xml', svg: 'xml',
  };
  return map[ext.toLowerCase()] ?? 'plaintext';
}
