import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface JsonSchemaObject {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface ToolCallContext {
  /** Aborted when the client cancels the call or disconnects. */
  signal?: AbortSignal;
}

/**
 * MCP tool annotations are hints for the client, not enforcement. Every tool here only reads, so all declare
 * `readOnlyHint`. Offline tools answer from content bundled in the package, so they also declare a closed world;
 * live tools call ADSP APIs and keep the spec's default open world.
 */
export const OFFLINE_TOOL_ANNOTATIONS = { readOnlyHint: true, openWorldHint: false } as const;
export const LIVE_TOOL_ANNOTATIONS = { readOnlyHint: true } as const;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  annotations: typeof OFFLINE_TOOL_ANNOTATIONS;
  /**
   * Must be a pure lookup/computation over `args` and this tool's own read-only data (docs, SDK reference) — no
   * network calls, filesystem writes, or other external side effects. `CallToolResult.isError` on the return value
   * is the MCP protocol's standard way to signal a handled failure (e.g. an unknown doc path); it is not a hidden
   * side effect, just a normal part of the result shape.
   */
  handler: (args: Record<string, unknown>, context?: ToolCallContext) => Promise<CallToolResult> | CallToolResult;
}

export interface LiveToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchemaObject;
  annotations: typeof LIVE_TOOL_ANNOTATIONS;
  /**
   * Unlike ToolDefinition.handler, this MAY make network calls and read local files (e.g. an
   * ADSP API call authenticated via a cached CLI login token) — it is not required to be a pure,
   * side-effect-free lookup. Kept as a distinct type so that invariant stays true and checkable
   * for every ToolDefinition-typed tool in this package.
   */
  handler: (args: Record<string, unknown>, context?: ToolCallContext) => Promise<CallToolResult> | CallToolResult;
}
