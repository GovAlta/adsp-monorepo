import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { getMetrics } from '../metrics';
import { Semaphore } from '../semaphore';

const DEFAULT_MAX_CONCURRENT = 8;
const DEFAULT_WAIT_MS = 1000;

let permits = new Semaphore(DEFAULT_MAX_CONCURRENT);
let permitWaitMs = DEFAULT_WAIT_MS;

// Marks busy results without adding anything to what the client sees.
const busyResults = new WeakSet<CallToolResult>();

export function configureLiveToolLimit({ maxConcurrent, waitMs }: { maxConcurrent: number; waitMs: number }): void {
  permits = new Semaphore(maxConcurrent);
  permitWaitMs = waitMs;
}

/** Runs a live tool's upstream calls under a shared per-process cap, so they can't fan out without bound. */
export async function withLiveToolPermit(run: () => Promise<CallToolResult>): Promise<CallToolResult> {
  const release = await permits.acquire(permitWaitMs);
  if (!release) {
    getMetrics().recordRejection('live_tool_cap');
    const busy: CallToolResult = {
      isError: true,
      content: [{ type: 'text', text: 'ADSP upstream is busy. Retry shortly.' }],
    };
    busyResults.add(busy);
    return busy;
  }

  try {
    return await run();
  } finally {
    release();
  }
}

export function isBusyResult(result: CallToolResult): boolean {
  return busyResults.has(result);
}
