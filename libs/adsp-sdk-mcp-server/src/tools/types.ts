import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface JsonSchemaObject {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  /**
   * Must be a pure lookup/computation over `args` and this tool's own read-only data (docs, SDK reference) — no
   * network calls, filesystem writes, or other external side effects. `CallToolResult.isError` on the return value
   * is the MCP protocol's standard way to signal a handled failure (e.g. an unknown doc path); it is not a hidden
   * side effect, just a normal part of the result shape.
   */
  handler: (args: Record<string, unknown>) => Promise<CallToolResult> | CallToolResult;
}

export interface LiveToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  /**
   * Unlike ToolDefinition.handler, this MAY make network calls and read local files (e.g. an
   * ADSP API call authenticated via a cached CLI login token) — it is not required to be a pure,
   * side-effect-free lookup. Kept as a distinct type so that invariant stays true and checkable
   * for every ToolDefinition-typed tool in this package.
   */
  handler: (args: Record<string, unknown>) => Promise<CallToolResult> | CallToolResult;
}
