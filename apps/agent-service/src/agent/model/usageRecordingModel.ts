import { getUsageRecorder, TokenUsage } from './conversationUsage';

type UsageCount = number | { total?: number } | undefined;

interface ProviderUsage {
  inputTokens?: UsageCount;
  outputTokens?: UsageCount;
  totalTokens?: UsageCount;
}

interface RequestContextReader {
  get(key: string): unknown;
}

interface StreamPart {
  type?: string;
  usage?: ProviderUsage;
}

type ModelCall = (...args: unknown[]) => Promise<Record<string, unknown>>;

function countOf(value: UsageCount): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  return typeof value?.total === 'number' ? value.total : undefined;
}

/** Reads token counts in either shape providers report them: plain numbers, or `{ total }` objects. */
export function toTokenUsage(usage: ProviderUsage | undefined): TokenUsage | undefined {
  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: countOf(usage.inputTokens),
    outputTokens: countOf(usage.outputTokens),
    totalTokens: countOf(usage.totalTokens),
  };
}

/**
 * Wraps a model so every call it makes adds its usage to the request's usage recorder. For model calls made outside
 * the agent's own steps, such as input processors, whose usage the agent's reply would otherwise leave out.
 */
export function withUsageRecording<T>(model: T, requestContext: RequestContextReader | undefined): T {
  if (!model || typeof model !== 'object') {
    return model;
  }

  const record = (usage: ProviderUsage | undefined) => getUsageRecorder(requestContext)?.record(toTokenUsage(usage));

  return new Proxy(model as T & object, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (property === 'doGenerate' && typeof value === 'function') {
        return async (...args: unknown[]) => {
          const result = await (value as ModelCall).apply(target, args);
          record(result?.usage as ProviderUsage | undefined);
          return result;
        };
      }
      if (property === 'doStream' && typeof value === 'function') {
        return async (...args: unknown[]) => {
          const result = await (value as ModelCall).apply(target, args);
          const stream = result?.stream as ReadableStream<StreamPart> | undefined;
          if (!stream) {
            return result;
          }

          return {
            ...result,
            stream: stream.pipeThrough(
              new TransformStream<StreamPart, StreamPart>({
                transform(part, controller) {
                  if (part?.type === 'finish') {
                    record(part.usage);
                  }
                  controller.enqueue(part);
                },
              }),
            ),
          };
        };
      }
      return value;
    },
  });
}
