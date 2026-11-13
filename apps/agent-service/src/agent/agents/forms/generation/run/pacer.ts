import type { Logger } from 'winston';
import { environment } from '../../../../../environments/environment';
import type { UsageRecorder } from '../../../../model/conversationUsage';
import { FORM_GENERATION_AGENT_ID } from '../../../../model/executionLimits';
import { parseAgentShares } from '../../../../model/tokenBudget';

const WINDOW_MS = 60_000;
/** Estimate for the first step builder call of a run, before one has been measured. */
export const DEFAULT_STEP_ESTIMATE_TOKENS = 8000;
export const PLANNER_ESTIMATE_TOKENS = 2000;

type PacingEnvironment = Pick<
  typeof environment,
  'AGENT_FORM_GENERATION_TOKENS_PER_MINUTE' | 'AGENT_TOKEN_LIMIT_PER_MINUTE' | 'AGENT_TOKEN_AGENT_SHARES'
>;

/**
 * Tokens per minute a build's model calls may take, counting the reply's other calls in the same minute; 0 is no
 * pacing. The configured key budget, with the agent's share of it, lowers the limit further.
 */
export function getGenerationTokensPerMinute(env: PacingEnvironment = environment): number {
  const own = env.AGENT_FORM_GENERATION_TOKENS_PER_MINUTE;
  if (own <= 0) {
    return 0;
  }
  if (env.AGENT_TOKEN_LIMIT_PER_MINUTE <= 0) {
    return own;
  }

  const share = parseAgentShares(env.AGENT_TOKEN_AGENT_SHARES).shares.get(FORM_GENERATION_AGENT_ID) ?? 1;
  return Math.min(own, Math.floor(env.AGENT_TOKEN_LIMIT_PER_MINUTE * share));
}

export interface GenerationPacer {
  /** Waits until a call of the estimated size fits in the last minute's usage. Resolves at once when it fits. */
  waitForRoom(estimate: number): Promise<void>;
  /** Remembers what a step call used, as the estimate for the next one. */
  noteStep(tokens: number): void;
  /** What the next step call is expected to use: the last step call measured, or a default. */
  readonly stepEstimate: number;
}

interface PacerOptions {
  tokensPerMinute: number;
  /** The reply's model calls: the agent's own, the prompt injection check and this run's. */
  usage: Pick<UsageRecorder, 'callsSince'>;
  abortSignal?: AbortSignal;
  logger?: Logger;
  now?: () => number;
  sleep?: (ms: number, abortSignal?: AbortSignal) => Promise<void>;
}

function abortableSleep(ms: number, abortSignal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      abortSignal?.removeEventListener('abort', done);
      resolve();
    }
    abortSignal?.addEventListener('abort', done, { once: true });
  });
}

/**
 * Spaces out a build's model calls so that the reply stays within a per-minute token limit, over a sliding window of
 * every model call the reply has made. Without it a build sends one large call after another and takes the shared
 * key's whole limit, so other agents' requests are rate limited until it finishes. The limit leaves room for the
 * agent's reply after the build, which is not paced.
 */
export function createGenerationPacer({
  tokensPerMinute,
  usage,
  abortSignal,
  logger,
  now = Date.now,
  sleep = abortableSleep,
}: PacerOptions): GenerationPacer {
  let lastStepTokens: number | undefined;

  /** How long until enough of the window expires for the estimate to fit; 0 when it fits now. */
  const waitFor = (estimate: number) => {
    const window = usage.callsSince(now() - WINDOW_MS);
    const needed = Math.min(Math.max(estimate, 0), tokensPerMinute);
    const excess = window.reduce((sum, call) => sum + call.tokens, 0) + needed - tokensPerMinute;
    let freed = 0;
    for (const call of window) {
      if (freed >= excess) {
        break;
      }
      freed += call.tokens;
      if (freed >= excess) {
        return call.at + WINDOW_MS - now();
      }
    }
    return 0;
  };

  return {
    async waitForRoom(estimate) {
      if (tokensPerMinute <= 0) {
        return;
      }
      for (let ms = waitFor(estimate); ms > 0 && !abortSignal?.aborted; ms = waitFor(estimate)) {
        logger?.debug(
          `Form generation waits ${Math.ceil(ms / 1000)}s to stay within ${tokensPerMinute} tokens per minute.`,
          { context: 'FormGenerationPacer' },
        );
        await sleep(ms + 50, abortSignal);
      }
    },
    noteStep(tokens) {
      if (Number.isFinite(tokens) && tokens > 0) {
        lastStepTokens = tokens;
      }
    },
    get stepEstimate() {
      return lastStepTokens ?? DEFAULT_STEP_ESTIMATE_TOKENS;
    },
  };
}
