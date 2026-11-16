/** Token counts as the AI SDK reports them. Any of them can be missing when the provider leaves them out. */
export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

/** What one agent reply used, shown to the user under the reply. */
export interface ReplyUsage {
  /** Input tokens of the agent's last model call: how much of the context window the conversation takes up. */
  contextTokens: number;
  contextWindowTokens: number;
  /** Every token the reply used across its model calls, including calls made inside tools. */
  totalTokens: number;
  outputTokens: number;
  modelCalls: number;
}

/** Memory has started keeping the conversation short, or the conversation has grown long enough that a new chat
 * would answer more cheaply; normal behaviour that users should know about. */
export type ConversationNoticeReason = 'summarised' | 'older-messages-dropped' | 'long-conversation';
/** The conversation is close to what the assistant can handle well. */
export type ConversationWarningReason = 'near-context-limit' | 'notes-condensed';

/**
 * How the conversation stands after a reply: ok, a notice once memory starts summarising or dropping older messages,
 * or a warning once it is close to what the assistant can handle well.
 */
export type ConversationStatus = {
  contextTokens: number;
  contextWindowTokens: number;
} & (
  | { state: 'ok' }
  | { state: 'notice'; reason: ConversationNoticeReason; messageLimit?: number }
  | { state: 'warning'; reason: ConversationWarningReason }
);

/** Observational memory's token counts, read from its data-om-status stream part. */
export interface MemoryStatus {
  messageTokens: number;
  messageThreshold: number;
  observationTokens: number;
  observationThreshold: number;
  /** Times observational memory has condensed its notes; it starts at 0. */
  generationCount: number;
}

/** Message history of an agent without observational memory, which only reads the most recent lastMessages. */
export interface MessageHistory {
  storedMessages: number;
  lastMessages: number;
}

/** Share of the context window at which the conversation is close to the assistant's limit. */
export const NEAR_CONTEXT_LIMIT_RATIO = 0.7;

/** Request context key of the recorder that collects usage of model calls made inside tools. */
export const USAGE_RECORDER_KEY = 'usageRecorder';

interface RecordedUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  modelCalls: number;
}

/**
 * Adds up model calls that an agent's own usage leaves out, such as the planner and step builders that the form
 * generation tool runs.
 */
export class UsageRecorder {
  private recorded: RecordedUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0, modelCalls: 0 };

  record(usage: TokenUsage | undefined, modelCalls = 1): void {
    this.recorded = {
      inputTokens: this.recorded.inputTokens + (usage?.inputTokens ?? 0),
      outputTokens: this.recorded.outputTokens + (usage?.outputTokens ?? 0),
      totalTokens: this.recorded.totalTokens + totalOf(usage),
      modelCalls: this.recorded.modelCalls + modelCalls,
    };
  }

  get total(): RecordedUsage {
    return { ...this.recorded };
  }
}

export function getUsageRecorder(requestContext: { get(key: string): unknown } | undefined): UsageRecorder | undefined {
  const recorder = requestContext?.get(USAGE_RECORDER_KEY);
  return recorder instanceof UsageRecorder ? recorder : undefined;
}

/** Records the usage of a generate() result, which spans all of its steps. */
export function recordGenerateUsage(
  recorder: UsageRecorder | undefined,
  result: { totalUsage?: TokenUsage; usage?: TokenUsage; steps?: unknown[] },
): void {
  recorder?.record(result.totalUsage ?? result.usage, result.steps?.length || 1);
}

interface StreamUsageSource {
  steps?: PromiseLike<Array<{ usage?: TokenUsage }>> | Array<{ usage?: TokenUsage }>;
  totalUsage?: PromiseLike<TokenUsage> | TokenUsage;
}

/**
 * Reads what a finished stream used. Resolves to undefined when the provider reported no usage, so the user is not
 * shown zeros.
 */
export async function readReplyUsage(
  result: StreamUsageSource,
  toolUsage: UsageRecorder,
  contextWindowTokens: number,
): Promise<ReplyUsage | undefined> {
  const [steps, total] = await Promise.all([result.steps, result.totalUsage]);
  const lastCall = steps?.[steps.length - 1]?.usage;
  const tools = toolUsage.total;
  const totalTokens = totalOf(total) + tools.totalTokens;

  if (!totalTokens) {
    return undefined;
  }

  return {
    contextTokens: lastCall?.inputTokens ?? 0,
    contextWindowTokens,
    totalTokens,
    outputTokens: (total?.outputTokens ?? 0) + tools.outputTokens,
    modelCalls: (steps?.length ?? 0) + tools.modelCalls,
  };
}

function totalOf(usage: TokenUsage | undefined): number {
  return usage?.totalTokens ?? (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
}

/** Reads observational memory's status part. Other stream parts resolve to undefined. */
export function readMemoryStatus(chunk: unknown): MemoryStatus | undefined {
  if (!isRecord(chunk) || chunk.type !== 'data-om-status') {
    return undefined;
  }

  const data = isRecord(chunk.data) ? chunk.data : isRecord(chunk.payload) ? chunk.payload.data : undefined;
  const windows = isRecord(data) && isRecord(data.windows) ? data.windows : undefined;
  const active = isRecord(windows?.active) ? windows.active : undefined;
  const messages = isRecord(active?.messages) ? active.messages : undefined;
  const observations = isRecord(active?.observations) ? active.observations : undefined;
  if (!messages || !observations) {
    return undefined;
  }

  return {
    messageTokens: numberOf(messages.tokens),
    messageThreshold: numberOf(messages.threshold),
    observationTokens: numberOf(observations.tokens),
    observationThreshold: numberOf(observations.threshold),
    generationCount: numberOf(isRecord(data) ? data.generationCount : undefined),
  };
}

export function getConversationStatus({
  contextTokens,
  contextWindowTokens,
  memoryStatus,
  history,
  longConversationTokens = 0,
}: {
  contextTokens: number;
  contextWindowTokens: number;
  memoryStatus?: MemoryStatus;
  history?: MessageHistory;
  /** Context tokens at which to suggest a new chat; 0 never suggests one. */
  longConversationTokens?: number;
}): ConversationStatus {
  const context = { contextTokens, contextWindowTokens };

  if (contextWindowTokens > 0 && contextTokens >= contextWindowTokens * NEAR_CONTEXT_LIMIT_RATIO) {
    return { ...context, state: 'warning', reason: 'near-context-limit' };
  }
  // Condensing happens once the notes themselves pass their threshold, which takes a very long conversation.
  if (memoryStatus && memoryStatus.generationCount > 0) {
    return { ...context, state: 'warning', reason: 'notes-condensed' };
  }
  if (memoryStatus && memoryStatus.observationTokens > 0) {
    return { ...context, state: 'notice', reason: 'summarised' };
  }
  if (longConversationTokens > 0 && contextTokens >= longConversationTokens) {
    return { ...context, state: 'notice', reason: 'long-conversation' };
  }
  if (history && history.storedMessages > history.lastMessages) {
    return { ...context, state: 'notice', reason: 'older-messages-dropped', messageLimit: history.lastMessages };
  }
  return { ...context, state: 'ok' };
}

/** Mirrors how Mastra reads the observationalMemory option: true, or a config object not marked enabled: false. */
export function usesObservationalMemory(config: unknown): boolean {
  return config === true || (isRecord(config) && config.enabled !== false);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberOf(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
