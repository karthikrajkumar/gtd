/**
 * GTD Tools wrapper — executes gtd-tools.cjs commands programmatically.
 */

import { execSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

export class GtdTools {
  private readonly projectDir: string;
  private readonly toolsPath: string;

  constructor(projectDir: string) {
    this.projectDir = projectDir;
    this.toolsPath = this.resolveToolsPath();
  }

  /** Execute a gtd-tools command and return stdout */
  async run(command: string, args: string[] = []): Promise<string> {
    const cmd = `node "${this.toolsPath}" ${command} ${args.join(' ')}`;
    try {
      return execSync(cmd, {
        cwd: this.projectDir,
        encoding: 'utf8',
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch (err: any) {
      throw new Error(`gtd-tools ${command} failed: ${err.stderr || err.message}`);
    }
  }

  /** Execute and parse JSON result */
  async runJson(command: string, args: string[] = []): Promise<any> {
    const output = await this.run(command, args);
    try {
      return JSON.parse(output);
    } catch (_) {
      return output;
    }
  }

  /** Resolve the path to gtd-tools.cjs */
  private resolveToolsPath(): string {
    // Check local .planning installation
    const localPath = join(this.projectDir, '.claude', 'get-things-done', 'bin', 'gtd-tools.cjs');
    if (existsSync(localPath)) return localPath;

    // Check global installation
    const homedir = process.env.HOME || process.env.USERPROFILE || '';
    const globalPath = join(homedir, '.claude', 'get-things-done', 'bin', 'gtd-tools.cjs');
    if (existsSync(globalPath)) return globalPath;

    // Fallback to package-relative path
    const packagePath = resolve(__dirname, '..', '..', 'bin', 'gtd-tools.cjs');
    if (existsSync(packagePath)) return packagePath;

    throw new Error('gtd-tools.cjs not found. Install GTD first: npx get-things-done@latest');
  }
}
