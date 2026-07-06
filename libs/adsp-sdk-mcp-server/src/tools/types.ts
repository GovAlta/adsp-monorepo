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
  handler: (args: Record<string, unknown>) => Promise<CallToolResult> | CallToolResult;
}
