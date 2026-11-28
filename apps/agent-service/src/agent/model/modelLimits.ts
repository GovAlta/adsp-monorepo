import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3GenerateResult,
  LanguageModelV3Prompt,
  LanguageModelV3StreamPart,
  LanguageModelV3StreamResult,
} from '@ai-sdk/provider';
import { environment } from '../../environments/environment';

/** What a model on the OpenAI-compatible endpoint can be asked to do. */
export interface ModelLimits {
  streaming: boolean;
  images: boolean;
  tools: boolean;
}

export const IMAGE_NOT_READ_NOTE =
  '[The user attached an image here, but the model in use cannot read images. If the answer depends on it, say you could not see it.]';

function listOf(value: string): Set<string> {
  return new Set(
    value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

export function getModelLimits(modelId: string): ModelLimits {
  return {
    streaming: !listOf(environment.MODELS_WITHOUT_STREAMING).has(modelId),
    images: !listOf(environment.MODELS_WITHOUT_IMAGES).has(modelId),
    tools: !listOf(environment.MODELS_WITHOUT_TOOLS).has(modelId),
  };
}

/** An agent with tools would answer without using them on a model that cannot call tools, so it gets MODEL instead. */
export function getToolAgentModelId(modelId: string): string {
  return getModelLimits(modelId).tools ? modelId : environment.MODEL;
}

/**
 * A model that cannot see images would otherwise ignore them silently and may answer as if it had read them, so each
 * image is replaced with a note the model can pass on.
 */
function withoutImages(prompt: LanguageModelV3Prompt): LanguageModelV3Prompt {
  return prompt.map((message) =>
    message.role === 'user'
      ? {
          ...message,
          content: message.content.map((part) =>
            part.type === 'file' && part.mediaType.startsWith('image/')
              ? { type: 'text' as const, text: IMAGE_NOT_READ_NOTE }
              : part,
          ),
        }
      : message,
  );
}

/** Sends a whole reply as the stream parts a streamed call would have produced, in the order of its content. */
function replayAsStream(result: LanguageModelV3GenerateResult): LanguageModelV3StreamResult {
  const parts: LanguageModelV3StreamPart[] = [{ type: 'stream-start', warnings: result.warnings }];
  if (result.response) {
    const { id, timestamp, modelId } = result.response;
    parts.push({ type: 'response-metadata', id, timestamp, modelId });
  }

  result.content.forEach((content, index) => {
    const id = String(index);
    if (content.type === 'text') {
      parts.push(
        { type: 'text-start', id, providerMetadata: content.providerMetadata },
        { type: 'text-delta', id, delta: content.text },
        { type: 'text-end', id },
      );
    } else if (content.type === 'reasoning') {
      parts.push(
        { type: 'reasoning-start', id, providerMetadata: content.providerMetadata },
        { type: 'reasoning-delta', id, delta: content.text },
        { type: 'reasoning-end', id },
      );
    } else {
      parts.push(content);
    }
  });

  parts.push({
    type: 'finish',
    usage: result.usage,
    finishReason: result.finishReason,
    providerMetadata: result.providerMetadata,
  });

  return {
    stream: new ReadableStream<LanguageModelV3StreamPart>({
      start(controller) {
        parts.forEach((part) => controller.enqueue(part));
        controller.close();
      },
    }),
    request: result.request,
    response: { headers: result.response?.headers },
  };
}

/**
 * Holds a model to what it can do: images are replaced with a note for a model that cannot read them, and a model
 * that corrupts streamed replies is called without streaming while still answering stream calls.
 */
export function withModelLimits<T extends LanguageModelV3>(model: T, limits: ModelLimits): T {
  if (limits.streaming && limits.images) {
    return model;
  }

  const adapt = (options: LanguageModelV3CallOptions): LanguageModelV3CallOptions =>
    limits.images ? options : { ...options, prompt: withoutImages(options.prompt) };

  return new Proxy(model, {
    get(target, property, receiver) {
      if (property === 'doGenerate') {
        return (options: LanguageModelV3CallOptions) => target.doGenerate(adapt(options));
      }
      if (property === 'doStream') {
        return async (options: LanguageModelV3CallOptions) =>
          limits.streaming ? target.doStream(adapt(options)) : replayAsStream(await target.doGenerate(adapt(options)));
      }
      return Reflect.get(target, property, receiver);
    },
  });
}
