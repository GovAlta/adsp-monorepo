import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Related } from './links';
import { createConfigurationSchemaTools } from './registerConfigurationSchemaTool';
import { createServiceRolesTools } from './registerServiceRolesTool';
import { isOfflineTool } from './types';

export interface SuggestedCall {
  tool: string;
  arguments: Record<string, unknown>;
  why: string;
}

export interface Next {
  suggested_calls: SuggestedCall[];
}

export const MAX_SUGGESTED_CALLS = 3;

// Live tools need sign-in, so offline responses must not point at them.
const LIVE_TOOL_NAMES = new Set(
  [...createServiceRolesTools(), ...createConfigurationSchemaTools()]
    .filter((tool) => !isOfflineTool(tool))
    .map((tool) => tool.name),
);

const callKey = (call: { tool: string; arguments: Record<string, unknown> }) =>
  `${call.tool}:${JSON.stringify(call.arguments, Object.keys(call.arguments).sort())}`;

export function buildNext(
  calls: (SuggestedCall | undefined)[],
  current?: { tool: string; arguments: Record<string, unknown> },
): Next | undefined {
  const seen = new Set<string>(current ? [callKey(current)] : []);
  const suggested: SuggestedCall[] = [];
  for (const call of calls) {
    if (!call || LIVE_TOOL_NAMES.has(call.tool) || seen.has(callKey(call))) {
      continue;
    }
    seen.add(callKey(call));
    suggested.push(call);
  }
  return suggested.length > 0 ? { suggested_calls: suggested.slice(0, MAX_SUGGESTED_CALLS) } : undefined;
}

export function withRelatedAndNext<T extends object>(
  value: T,
  related: Related | undefined,
  next: Next | undefined,
): T & { related?: Related; next?: Next } {
  return {
    ...value,
    ...(related && Object.keys(related).length > 0 ? { related } : {}),
    ...(next ? { next } : {}),
  };
}

export function jsonText(value: unknown): CallToolResult {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
