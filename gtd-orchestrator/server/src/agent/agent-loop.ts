/**
 * Agent Loop — Gemini-driven orchestration:
 *   prompt → Gemini → function calls → MCP → repeat
 *
 * The orchestrator owns this loop. The sandbox service only exposes tools.
 */

import { GoogleGenAI, type Content, type Part } from '@google/genai';
import type { Config } from '../config.js';
import type { SessionState } from '../session/types.js';
import { sessionStore } from '../session/session-store.js';
import type { McpProxy } from '../sandbox/mcp-proxy.js';
import type { SandboxClient } from '../sandbox/sandbox-client.js';
import type { WsManager } from '../ws/ws-manager.js';
import { isFileModifyingTool } from './tool-converter.js';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { buildTree } from '../routes/files.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Max iterations of the agent loop.
 *
 * A single phase execution can easily take 20–40 tool calls (fs_write per
 * source file, run_bash for scaffold/install/test, gtd_* for state updates).
 * Keep this generous but finite.
 */
const MAX_LOOP_ITERATIONS = 80;

/**
 * Max number of auto-nudges we'll send when Gemini stops mid-workflow with
 * filler text ("please stand by", "I will now...") but no tool calls.
 * Prevents an infinite nudge loop while still rescuing the common case.
 */
const MAX_AUTO_NUDGES = 3;

/**
 * Heuristic: does this assistant text look like mid-workflow filler
 * ("I will now write the files", "please stand by", etc.) rather than a
 * genuine stop (asking the user a question, finishing a task)?
 */
function looksLikeMidWorkflowFiller(text: string): boolean {
  const t = text.toLowerCase().trim();
  if (!t) return false;
  // Genuine stopping points — don't nudge.
  if (t.endsWith('?')) return false;
  if (/\b(approve|confirm|ok to proceed|shall i proceed|would you like)\b/.test(t)) {
    return false;
  }
  // Filler patterns that mean "I'm about to do something but didn't".
  const fillers = [
    /please stand by/,
    /i (?:will|'ll) (?:now|proceed to|begin|start)/,
    /let me (?:now|proceed|begin|start)/,
    /starting (?:phase|task|step) [0-9]/,
    /i am now (?:writing|creating|scaffolding|proceeding)/,
    /proceeding with/,
    /i'll begin/,
  ];
  return fillers.some((re) => re.test(t));
}

export class AgentLoop {
  private genai: GoogleGenAI;
  private model: string;
  private maxTokens: number;

  constructor(
    private config: Config,
    private mcpProxy: McpProxy,
    private sandboxClient: SandboxClient,
    private wsManager: WsManager,
  ) {
    this.genai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
    this.model = config.GEMINI_MODEL;
    this.maxTokens = config.GEMINI_MAX_TOKENS;
  }

  /**
   * Run the agent loop for a user message.
   * Keeps calling Gemini until it stops issuing function calls.
   */
  async run(sessionId: string, userMessage: string): Promise<void> {
    const session = sessionStore.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (session.status === 'busy') throw new Error(`Session ${sessionId} is busy`);

    sessionStore.updateStatus(sessionId, 'busy');

    try {
      // Add user message to conversation (Gemini format: role='user', parts=[{text}])
      session.messages.push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      let iteration = 0;
      let autoNudges = 0;

      while (iteration < MAX_LOOP_ITERATIONS) {
        iteration++;

        const response = await this.genai.models.generateContent({
          model: this.model,
          contents: session.messages,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            maxOutputTokens: this.maxTokens,
            tools: session.geminiTools.length > 0
              ? [{ functionDeclarations: session.geminiTools }]
              : undefined,
          },
        });

        const messageId = uuidv4();

        // Extract parts from the response candidate
        const candidate = response.candidates?.[0];
        const parts: Part[] = candidate?.content?.parts ?? [];

        // Separate text and function calls
        const functionCallParts: Part[] = [];
        let textAccumulator = '';

        for (const part of parts) {
          if (part.text) {
            textAccumulator += part.text;
          }
          if (part.functionCall) {
            functionCallParts.push(part);
          }
        }

        // Emit any text to the UI
        if (textAccumulator) {
          this.wsManager.send(sessionId, {
            type: 'assistant_text',
            sessionId,
            messageId,
            text: textAccumulator,
          });
        }

        // Append the model's turn to conversation history verbatim
        session.messages.push({
          role: 'model',
          parts,
        });

        // If no function calls were made, the turn is either finished
        // or Gemini stopped mid-workflow with filler ("please stand by").
        // Auto-nudge up to MAX_AUTO_NUDGES times to rescue the common
        // case where gemini-2.5-flash emits filler instead of tool calls.
        if (functionCallParts.length === 0) {
          if (
            autoNudges < MAX_AUTO_NUDGES &&
            looksLikeMidWorkflowFiller(textAccumulator)
          ) {
            autoNudges++;
            session.messages.push({
              role: 'user',
              parts: [
                {
                  text:
                    '[system nudge] You ended your turn with filler text but the workflow is not done. ' +
                    'Emit the required tool calls now (fs_write, run_bash, gtd_*) — do not narrate what you are about to do, just do it.',
                },
              ],
            });
            continue;
          }

          this.wsManager.send(sessionId, {
            type: 'assistant_done',
            sessionId,
            messageId,
            stopReason: candidate?.finishReason ?? 'STOP',
          });
          break;
        }

        // Gemini emitted tool calls — reset the nudge counter for this turn.
        autoNudges = 0;

        // Execute each function call and collect results
        const functionResponseParts: Part[] = [];

        for (const fcPart of functionCallParts) {
          const fc = fcPart.functionCall!;
          // Gemini function calls don't always have an ID — generate one for UI tracking
          const toolCallId = fc.id ?? uuidv4();
          const fnName = fc.name ?? 'unknown';
          const fnArgs = (fc.args as Record<string, unknown>) ?? {};

          this.wsManager.send(sessionId, {
            type: 'tool_call_start',
            sessionId,
            toolCallId,
            name: fnName,
            arguments: fnArgs,
          });

          const startTime = Date.now();

          try {
            const result = await this.mcpProxy.callTool(
              session.mcpEndpoint,
              fnName,
              fnArgs,
            );
            const durationMs = Date.now() - startTime;

            this.wsManager.send(sessionId, {
              type: 'tool_call_result',
              sessionId,
              toolCallId,
              result,
              durationMs,
            });

            // Build Gemini function response part
            // Gemini expects { functionResponse: { name, response: { ... } } }
            // The response must be a JSON-compatible object
            const responseContent = result.content.map((c) => c.text).join('\n');

            functionResponseParts.push({
              functionResponse: {
                ...(fc.id ? { id: fc.id } : {}),
                name: fnName,
                response: result.isError
                  ? { error: responseContent }
                  : { output: responseContent },
              },
            });

            // Refresh file tree if this was a file-modifying tool
            if (isFileModifyingTool(fnName)) {
              await this.refreshFiles(session);
            }
          } catch (err: unknown) {
            const durationMs = Date.now() - startTime;
            const errorMsg = err instanceof Error ? err.message : String(err);

            this.wsManager.send(sessionId, {
              type: 'tool_call_result',
              sessionId,
              toolCallId,
              result: {
                content: [{ type: 'text', text: `Error: ${errorMsg}` }],
                isError: true,
              },
              durationMs,
            });

            functionResponseParts.push({
              functionResponse: {
                ...(fc.id ? { id: fc.id } : {}),
                name: fnName,
                response: { error: errorMsg },
              },
            });
          }
        }

        // Send function results back as a 'user' turn (Gemini's convention)
        session.messages.push({
          role: 'user',
          parts: functionResponseParts,
        });

        // Loop continues — Gemini will see the function responses in the next call
      }

      if (iteration >= MAX_LOOP_ITERATIONS) {
        this.wsManager.send(sessionId, {
          type: 'error',
          sessionId,
          message: `Agent loop hit max iterations (${MAX_LOOP_ITERATIONS}). Stopping.`,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.wsManager.send(sessionId, {
        type: 'error',
        sessionId,
        message: `Agent loop error: ${errorMsg}`,
      });
    } finally {
      sessionStore.updateStatus(sessionId, 'ready');
    }
  }

  /**
   * Refresh the file tree from the sandbox and notify UI.
   */
  private async refreshFiles(session: SessionState): Promise<void> {
    try {
      // List all workspace files including .planning/ (that's where GTD
      // writes PROJECT.md, REQUIREMENTS.md, ROADMAP.md, phase plans, etc.).
      // Only strip node_modules/ and .git/ for noise.
      const result = await this.sandboxClient.exec(session.sandboxId, [
        'find', '/workspace', '-type', 'f',
        '-not', '-path', '*/node_modules/*',
        '-not', '-path', '*/.git/*',
      ]);

      if (result.exitCode === 0) {
        const files = result.stdout
          .split('\n')
          .filter(Boolean)
          .map((f) => f.replace('/workspace/', ''))
          .sort();

        session.fileTree = files;
        const tree = buildTree(files);

        // Fetch content of recent files (best effort) so the editor can
        // open them as tabs.
        const recentFiles = files.slice(0, 20);
        const fileContents: Array<{ path: string; content: string }> = [];

        for (const filePath of recentFiles) {
          try {
            const catResult = await this.sandboxClient.exec(session.sandboxId, [
              'cat', `/workspace/${filePath}`,
            ]);
            if (catResult.exitCode === 0) {
              fileContents.push({ path: filePath, content: catResult.stdout });
            }
          } catch {
            // Skip unreadable
          }
        }

        // Always send tree (even if no file contents) so the Explorer
        // sidebar updates whenever files appear or disappear.
        this.wsManager.send(session.id, {
          type: 'file_changed',
          sessionId: session.id,
          files: fileContents,
          tree,
        });
      }
    } catch {
      // Non-critical
    }
  }
}
