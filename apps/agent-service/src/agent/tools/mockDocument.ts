import { randomBytes } from 'crypto';
import { createTool } from '@mastra/core/tools';
import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context';
import type { Logger } from 'winston';
import { z } from 'zod';
import { AdspRequestContext } from '../types';

interface MockHashToolsProps {
  logger: Logger;
}

type MockHashResult = {
  hash: string;
  inputLength: number;
  algorithm: 'random';
  reused: boolean;
};

/** Thread-scoped cache so the same input returns the prior hash until cleared/restarted. */
const hashCacheByThread = new Map<string, Map<string, Omit<MockHashResult, 'reused'>>>();

export function clearMockHashCache(threadId?: string): void {
  if (threadId) {
    hashCacheByThread.delete(threadId);
    return;
  }
  hashCacheByThread.clear();
}

/**
 * Minimal test tool: returns a cached hash when one already exists for this thread+input,
 * otherwise generates a new random hash and stores it.
 */
export async function createMockDocumentTools({ logger }: MockHashToolsProps) {
  const mockHashTool = createTool({
    id: 'mock-hash',
    description: `
      Generate a hash hex string for the given input label.
      Use this whenever the user asks to hash, checksum, fingerprint, or generate a hash number.
      Always call this tool instead of inventing a hash yourself.

      If a hash for this input was already produced earlier in the same conversation thread,
      this tool returns that same (old) hash. Otherwise it returns a new random hash.
      `,
    inputSchema: z.object({
      input: z.string().describe('Label or text associated with this hash request'),
    }),
    outputSchema: z.object({
      hash: z.string().describe('64-character hex string'),
      inputLength: z.number(),
      algorithm: z.literal('random'),
      reused: z.boolean().describe('True when an existing hash for this input was returned'),
    }),
    execute: async (inputData, context) => {
      const requestContext = context.requestContext as AdspRequestContext | undefined;
      const threadId =
        (typeof requestContext?.get(MASTRA_THREAD_ID_KEY) === 'string'
          ? (requestContext.get(MASTRA_THREAD_ID_KEY) as string)
          : undefined) || 'default';
      const cacheKey = inputData.input.trim();

      let threadCache = hashCacheByThread.get(threadId);
      if (!threadCache) {
        threadCache = new Map();
        hashCacheByThread.set(threadId, threadCache);
      }

      const existing = threadCache.get(cacheKey);
      if (existing) {
        logger.debug(`mockHashTool reused hash for thread ${threadId} input "${cacheKey.slice(0, 32)}"`, {
          context: 'MockHashTools',
        });
        return { ...existing, reused: true };
      }

      const created: Omit<MockHashResult, 'reused'> = {
        hash: randomBytes(32).toString('hex'),
        inputLength: inputData.input.length,
        algorithm: 'random',
      };
      threadCache.set(cacheKey, created);

      logger.debug(
        `mockHashTool new hash for thread ${threadId} input "${cacheKey.slice(0, 32)}" -> ${created.hash.slice(0, 12)}…`,
        { context: 'MockHashTools' },
      );

      return { ...created, reused: false };
    },
  });

  return { mockHashTool };
}
