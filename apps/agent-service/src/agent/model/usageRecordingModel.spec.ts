import { UsageRecorder, USAGE_RECORDER_KEY } from './conversationUsage';
import { toTokenUsage, withUsageRecording } from './usageRecordingModel';

const contextWith = (recorder?: UsageRecorder) => ({
  get: (key: string) => (key === USAGE_RECORDER_KEY ? recorder : undefined),
});

async function drain(stream: ReadableStream<unknown>): Promise<unknown[]> {
  const parts: unknown[] = [];
  const reader = stream.getReader();
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    parts.push(next.value);
  }
  return parts;
}

describe('toTokenUsage', () => {
  it('reads plain and total-object counts', () => {
    expect(toTokenUsage({ inputTokens: 10, outputTokens: 2, totalTokens: 12 })).toEqual({
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: 12,
    });
    expect(toTokenUsage({ inputTokens: { total: 10 }, outputTokens: { total: 2 } })).toEqual({
      inputTokens: 10,
      outputTokens: 2,
      totalTokens: undefined,
    });
    expect(toTokenUsage(undefined)).toBeUndefined();
  });
});

describe('withUsageRecording', () => {
  it('records the usage of a generate call', async () => {
    const recorder = new UsageRecorder();
    const model = {
      modelId: 'gpt',
      doGenerate: jest.fn().mockResolvedValue({ usage: { inputTokens: 200, outputTokens: 20 } }),
    };

    const wrapped = withUsageRecording(model, contextWith(recorder));
    await wrapped.doGenerate({});

    expect(wrapped.modelId).toBe('gpt');
    expect(recorder.total).toEqual({ inputTokens: 200, outputTokens: 20, totalTokens: 220, modelCalls: 1 });
  });

  it('records the usage of a stream when it finishes and passes every part through', async () => {
    const recorder = new UsageRecorder();
    const parts = [
      { type: 'text-delta', delta: 'ok' },
      { type: 'finish', usage: { inputTokens: { total: 223 }, outputTokens: { total: 21 } } },
    ];
    const model = {
      doStream: jest.fn().mockResolvedValue({
        stream: new ReadableStream({
          start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
          },
        }),
      }),
    };

    const result = await withUsageRecording(model, contextWith(recorder)).doStream({});

    expect(await drain(result.stream as ReadableStream<unknown>)).toEqual(parts);
    expect(recorder.total.totalTokens).toBe(244);
  });

  it('leaves a model id string and calls without a recorder alone', async () => {
    expect(withUsageRecording('gpt-5.1', contextWith())).toBe('gpt-5.1');

    const model = { doGenerate: jest.fn().mockResolvedValue({ usage: { inputTokens: 1 } }) };
    await expect(withUsageRecording(model, contextWith()).doGenerate({})).resolves.toEqual({
      usage: { inputTokens: 1 },
    });
  });
});
