const mockEnvironment = {
  MODEL: 'qwen3-coder/Qwen/Qwen3-Coder-Next',
  MODELS_WITHOUT_STREAMING: 'GOA-Default, gemma4/google/gemma-4-31b-it',
  MODELS_WITHOUT_IMAGES: 'qwen3-coder/Qwen/Qwen3-Coder-Next',
  MODELS_WITHOUT_TOOLS: 'gpt-oss-120b/openai/gpt-oss-120b',
};

jest.mock('../../environments/environment', () => ({ environment: mockEnvironment }));

import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import { getModelLimits, getToolAgentModelId, IMAGE_NOT_READ_NOTE, withModelLimits } from './modelLimits';

const USAGE = {
  inputTokens: { total: 120, noCache: 120, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 30, text: 30, reasoning: 0 },
};

function fakeModel(result?: Partial<LanguageModelV3GenerateResult>) {
  const doGenerate = jest.fn().mockResolvedValue({
    content: [],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: USAGE,
    warnings: [],
    ...result,
  });
  const doStream = jest.fn().mockResolvedValue({ stream: new ReadableStream() });
  const model = {
    specificationVersion: 'v3',
    provider: 'openai.chat',
    modelId: 'model',
    supportedUrls: {},
    doGenerate,
    doStream,
  } as unknown as LanguageModelV3;
  return { model, doGenerate, doStream };
}

async function readAll(stream: ReadableStream<LanguageModelV3StreamPart>): Promise<LanguageModelV3StreamPart[]> {
  const parts: LanguageModelV3StreamPart[] = [];
  const reader = stream.getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    parts.push(next.value);
  }
  return parts;
}

const TEXT_PROMPT: LanguageModelV3CallOptions = {
  prompt: [{ role: 'user', content: [{ type: 'text', text: 'Write the welcome email.' }] }],
};

describe('getModelLimits', () => {
  it('reads the comma-separated model lists, ignoring spaces', () => {
    // Act
    const limits = getModelLimits('gemma4/google/gemma-4-31b-it');

    // Assert
    expect(limits).toEqual({ streaming: false, images: true, tools: true });
  });
});

describe('getToolAgentModelId', () => {
  it('gives an agent with tools MODEL in place of a model that cannot call tools', () => {
    // Act
    const modelId = getToolAgentModelId('gpt-oss-120b/openai/gpt-oss-120b');

    // Assert
    expect(modelId).toBe('qwen3-coder/Qwen/Qwen3-Coder-Next');
  });

  it('keeps a model that can call tools', () => {
    // Act
    const modelId = getToolAgentModelId('GOA-Default');

    // Assert
    expect(modelId).toBe('GOA-Default');
  });
});

describe('withModelLimits', () => {
  it('returns a model without limits as it is', () => {
    // Arrange
    const { model } = fakeModel();

    // Act
    const limited = withModelLimits(model, { streaming: true, images: true, tools: true });

    // Assert
    expect(limited).toBe(model);
  });

  it('answers a stream call for a model without streaming with one whole reply, sent as stream parts', async () => {
    // Arrange
    const toolCall = {
      type: 'tool-call' as const,
      toolCallId: 'call-1',
      toolName: 'saveTemplate',
      input: '{"subject":"Hi"}',
    };
    const { model, doGenerate, doStream } = fakeModel({
      content: [
        { type: 'reasoning', text: 'Plan the email.' },
        { type: 'text', text: 'Saved the template.' },
        toolCall,
      ],
      finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
      response: { id: 'reply-1', modelId: 'google/gemma-4-31b-it' },
    });
    const limited = withModelLimits(model, { streaming: false, images: true, tools: true });

    // Act
    const { stream } = await limited.doStream(TEXT_PROMPT);
    const parts = await readAll(stream);

    // Assert
    expect(doStream).not.toHaveBeenCalled();
    expect(doGenerate).toHaveBeenCalledWith(TEXT_PROMPT);
    expect(parts).toEqual([
      { type: 'stream-start', warnings: [] },
      { type: 'response-metadata', id: 'reply-1', timestamp: undefined, modelId: 'google/gemma-4-31b-it' },
      { type: 'reasoning-start', id: '0', providerMetadata: undefined },
      { type: 'reasoning-delta', id: '0', delta: 'Plan the email.' },
      { type: 'reasoning-end', id: '0' },
      { type: 'text-start', id: '1', providerMetadata: undefined },
      { type: 'text-delta', id: '1', delta: 'Saved the template.' },
      { type: 'text-end', id: '1' },
      toolCall,
      {
        type: 'finish',
        usage: USAGE,
        finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
        providerMetadata: undefined,
      },
    ]);
  });

  it('replaces images with a note for a model that cannot read them, keeping the text', async () => {
    // Arrange
    const { model, doStream } = fakeModel();
    const limited = withModelLimits(model, { streaming: true, images: false, tools: true });

    // Act
    await limited.doStream({
      prompt: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Match this mockup.' },
            { type: 'file', mediaType: 'image/png', data: 'aGVsbG8=' },
            { type: 'file', mediaType: 'application/pdf', data: 'JVBERi0=' },
          ],
        },
      ],
    });

    // Assert
    const [{ prompt }] = doStream.mock.calls[0];
    expect(prompt[0].content).toEqual([
      { type: 'text', text: 'Match this mockup.' },
      { type: 'text', text: IMAGE_NOT_READ_NOTE },
      { type: 'file', mediaType: 'application/pdf', data: 'JVBERi0=' },
    ]);
  });
});
