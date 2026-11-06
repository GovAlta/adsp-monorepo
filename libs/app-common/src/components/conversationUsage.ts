import { AgentUsage, ConversationStatus } from '../types/agent';

const THOUSAND = 1000;
const MILLION = 1000000;

/** Shortens a token count for display: 850, 9.4k, 36k, 1.3M. */
export function formatTokens(tokens: number): string {
  if (tokens >= MILLION) {
    return `${trimDecimal(tokens / MILLION)}M`;
  }
  if (tokens >= 10 * THOUSAND) {
    return `${Math.round(tokens / THOUSAND)}k`;
  }
  if (tokens >= THOUSAND) {
    return `${trimDecimal(tokens / THOUSAND)}k`;
  }
  return `${Math.round(tokens)}`;
}

/** Shows the context used to one decimal, so a turn that adds a few hundred tokens still changes it: 14.3k. */
export function formatContextTokens(tokens: number): string {
  if (tokens >= MILLION) {
    return `${trimDecimal(tokens / MILLION)}M`;
  }
  return tokens >= THOUSAND ? `${trimDecimal(tokens / THOUSAND)}k` : `${Math.round(tokens)}`;
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

/** Share of the context window the conversation takes up, as a whole percentage. */
export function contextPercent({
  contextTokens,
  contextWindowTokens,
}: {
  contextTokens: number;
  contextWindowTokens: number;
}): number {
  return contextWindowTokens > 0 ? Math.min(100, Math.round((contextTokens / contextWindowTokens) * 100)) : 0;
}

/** The line under a finished reply, such as "About 111k tokens · 3 model calls". */
export function describeUsage({ totalTokens, modelCalls }: AgentUsage): string {
  const calls = modelCalls === 1 ? '1 model call' : `${modelCalls} model calls`;
  return `About ${formatTokens(totalTokens)} tokens · ${calls}`;
}

export interface ConversationStatusText {
  heading: string;
  /** A few words for narrow spaces. */
  shortHeading: string;
  detail: string;
}

const NEAR_LIMIT_HEADING = 'Close to the assistant’s limit';

/** What to tell the user about a notice or warning; nothing while the conversation is ok. */
export function describeConversationStatus(status: ConversationStatus | undefined): ConversationStatusText | undefined {
  switch (status?.reason) {
    case 'summarised':
      return {
        heading: 'Earlier messages summarised',
        shortHeading: 'Summarised',
        detail: 'Details from early in the chat may be missed.',
      };
    case 'older-messages-dropped': {
      const limit = status.state === 'notice' ? status.messageLimit : undefined;
      return {
        heading: limit ? `Using your last ${limit} messages` : 'Using your most recent messages',
        shortHeading: limit ? `Last ${limit} messages` : 'Recent messages',
        detail: 'Earlier requests in this chat may be forgotten.',
      };
    }
    case 'near-context-limit':
      return {
        heading: NEAR_LIMIT_HEADING,
        shortHeading: 'Near limit',
        detail: 'This conversation fills most of the assistant’s context window, so answers may miss earlier details.',
      };
    case 'notes-condensed':
      return {
        heading: NEAR_LIMIT_HEADING,
        shortHeading: 'Near limit',
        detail: 'The assistant has condensed its notes of this long conversation, so answers may miss earlier details.',
      };
    default:
      return undefined;
  }
}
