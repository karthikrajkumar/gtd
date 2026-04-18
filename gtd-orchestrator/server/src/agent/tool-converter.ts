/**
 * Converts MCP tool definitions to Google Gemini FunctionDeclaration format.
 *
 * MCP tools have:  { name, description, inputSchema: { type, properties, required } }
 * Gemini expects:  { name, description, parameters: { type: 'OBJECT', properties, required } }
 *
 * Gemini uses uppercase enum-like types ('OBJECT', 'STRING', 'ARRAY', etc.),
 * while MCP/JSON Schema uses lowercase ('object', 'string', 'array').
 * We normalize them here.
 */

import type { FunctionDeclaration, Schema } from '@google/genai';
import { Type } from '@google/genai';
import type { McpToolDefinition } from '../session/types.js';

export function mcpToolsToGeminiTools(mcpTools: McpToolDefinition[]): FunctionDeclaration[] {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: jsonSchemaToGeminiSchema(tool.inputSchema) as Schema,
  }));
}

/**
 * Convert a JSON Schema (used by MCP) to Gemini's Schema format.
 * Key differences:
 *   - Gemini uses Type enum (OBJECT, STRING, ARRAY, NUMBER, INTEGER, BOOLEAN)
 *   - Gemini doesn't support oneOf/anyOf/allOf at top level (we flatten/skip)
 */
function jsonSchemaToGeminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  if (!schema || typeof schema !== 'object') return { type: Type.OBJECT };

  const out: Record<string, unknown> = {};

  // Type mapping
  const t = schema.type;
  if (typeof t === 'string') {
    out.type = jsonTypeToGeminiType(t);
  } else {
    out.type = Type.OBJECT;
  }

  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.format) out.format = schema.format;

  // Properties
  if (schema.properties && typeof schema.properties === 'object') {
    const props: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(schema.properties as Record<string, unknown>)) {
      if (val && typeof val === 'object') {
        props[key] = jsonSchemaToGeminiSchema(val as Record<string, unknown>);
      }
    }
    out.properties = props;
  }

  // Required
  if (Array.isArray(schema.required)) out.required = schema.required;

  // Array items
  if (schema.items && typeof schema.items === 'object') {
    out.items = jsonSchemaToGeminiSchema(schema.items as Record<string, unknown>);
  }

  // Ensure objects always have a properties field (Gemini requirement)
  if (out.type === Type.OBJECT && !out.properties) {
    out.properties = {};
  }

  return out;
}

function jsonTypeToGeminiType(type: string): Type {
  switch (type.toLowerCase()) {
    case 'string': return Type.STRING;
    case 'number': return Type.NUMBER;
    case 'integer': return Type.INTEGER;
    case 'boolean': return Type.BOOLEAN;
    case 'array': return Type.ARRAY;
    case 'object': return Type.OBJECT;
    default: return Type.STRING;
  }
}

/**
 * Tools that modify files in the workspace. After these execute, we refresh
 * the file tree so the UI shows the new/changed files.
 *
 * Includes the local bridge tools (fs_write, run_bash) which are where
 * the LLM actually writes artifacts under this architecture, plus the
 * GTD MCP tools that can mutate .planning/ state.
 */
const FILE_MODIFYING_TOOLS = new Set([
  // Bridge-local filesystem / shell tools
  'fs_write',
  'run_bash',
  // GTD workflow tools that can write to .planning/ indirectly
  'gtd_new_project',
  'gtd_create_document',
  'gtd_execute_phase',
  'gtd_generate',
  'gtd_forward',
  'gtd_backward',
  'gtd_sync',
  'gtd_handover',
]);

export function isFileModifyingTool(name: string): boolean {
  return FILE_MODIFYING_TOOLS.has(name);
}
