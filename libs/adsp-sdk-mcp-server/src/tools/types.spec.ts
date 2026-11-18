import { isOfflineTool, LiveToolDefinition, OFFLINE_TOOL_ANNOTATIONS, ToolDefinition } from './types';

const handler = () => ({ content: [] });
const inputSchema = { type: 'object' as const };

describe('isOfflineTool', () => {
  it('accepts a tool that answers from bundled content', () => {
    const tool: ToolDefinition = {
      name: 'offline',
      description: '',
      inputSchema,
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      handler,
    };

    expect(isOfflineTool(tool)).toBe(true);
  });

  it('rejects a live tool even when it carries the offline annotations', () => {
    const tool: LiveToolDefinition = {
      kind: 'live',
      name: 'live',
      description: '',
      inputSchema,
      annotations: OFFLINE_TOOL_ANNOTATIONS,
      handler,
    };

    expect(isOfflineTool(tool)).toBe(false);
  });
});
