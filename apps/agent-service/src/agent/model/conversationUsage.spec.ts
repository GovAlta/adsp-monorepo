import { RequestContext } from '@mastra/core/request-context';
import {
  getConversationStatus,
  getUsageRecorder,
  readMemoryStatus,
  readReplyUsage,
  recordGenerateUsage,
  USAGE_RECORDER_KEY,
  UsageRecorder,
  usesObservationalMemory,
} from './conversationUsage';

const CONTEXT_WINDOW = 256000;

function omStatusPart(messageTokens: number, observationTokens: number, generationCount = 0) {
  return {
    type: 'data-om-status',
    data: {
      windows: {
        active: {
          messages: { tokens: messageTokens, threshold: 30000 },
          observations: { tokens: observationTokens, threshold: 40000 },
        },
      },
      threadId: 'thread-1',
      generationCount,
    },
  };
}

describe('UsageRecorder', () => {
  it('adds up the tokens and model calls it records', () => {
    // Arrange
    const recorder = new UsageRecorder();

    // Act
    recorder.record({ inputTokens: 12000, outputTokens: 800, totalTokens: 12800 });
    recorder.record({ inputTokens: 20000, outputTokens: 1500, totalTokens: 21500 }, 2);

    // Assert
    expect(recorder.total).toEqual({ inputTokens: 32000, outputTokens: 2300, totalTokens: 34300, modelCalls: 3 });
  });

  it('works out the total from input and output tokens when the provider leaves it out', () => {
    // Arrange
    const recorder = new UsageRecorder();

    // Act
    recorder.record({ inputTokens: 9000, outputTokens: 400 });

    // Assert
    expect(recorder.total.totalTokens).toBe(9400);
  });
});

describe('getUsageRecorder', () => {
  it('returns the recorder set in the request context', () => {
    // Arrange
    const recorder = new UsageRecorder();
    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set(USAGE_RECORDER_KEY, recorder);

    // Act
    const found = getUsageRecorder(requestContext);

    // Assert
    expect(found).toBe(recorder);
  });

  it('ignores a client-supplied value that is not a recorder', () => {
    // Arrange
    const requestContext = new RequestContext<Record<string, unknown>>();
    requestContext.set(USAGE_RECORDER_KEY, { record: 'not a recorder' });

    // Act
    const found = getUsageRecorder(requestContext);

    // Assert
    expect(found).toBeUndefined();
  });
});

describe('recordGenerateUsage', () => {
  it('records the total usage of every step of a generate result', () => {
    // Arrange
    const recorder = new UsageRecorder();
    const result = {
      usage: { inputTokens: 4000, outputTokens: 100, totalTokens: 4100 },
      totalUsage: { inputTokens: 21000, outputTokens: 2400, totalTokens: 23400 },
      steps: [{}, {}],
    };

    // Act
    recordGenerateUsage(recorder, result);

    // Assert
    expect(recorder.total).toEqual({ inputTokens: 21000, outputTokens: 2400, totalTokens: 23400, modelCalls: 2 });
  });
});

describe('readReplyUsage', () => {
  it('reports the last call input as the context used and adds tool usage to the totals', async () => {
    // Arrange
    const toolUsage = new UsageRecorder();
    toolUsage.record({ inputTokens: 150000, outputTokens: 12000, totalTokens: 162000 }, 9);
    const result = {
      steps: Promise.resolve([
        { usage: { inputTokens: 14000, outputTokens: 300 } },
        { usage: { inputTokens: 16000, outputTokens: 500 } },
      ]),
      totalUsage: Promise.resolve({ inputTokens: 30000, outputTokens: 800, totalTokens: 30800 }),
    };

    // Act
    const usage = await readReplyUsage(result, toolUsage, CONTEXT_WINDOW);

    // Assert
    expect(usage).toEqual({
      contextTokens: 16000,
      contextWindowTokens: CONTEXT_WINDOW,
      totalTokens: 192800,
      outputTokens: 12800,
      modelCalls: 11,
    });
  });

  it('resolves to undefined when the provider reported no usage', async () => {
    // Arrange
    const result = { steps: Promise.resolve([{ usage: {} }]), totalUsage: Promise.resolve({}) };

    // Act
    const usage = await readReplyUsage(result, new UsageRecorder(), CONTEXT_WINDOW);

    // Assert
    expect(usage).toBeUndefined();
  });
});

describe('readMemoryStatus', () => {
  it('reads the active message and observation tokens from a data-om-status part', () => {
    // Arrange
    const part = omStatusPart(18000, 2500);

    // Act
    const status = readMemoryStatus(part);

    // Assert
    expect(status).toEqual({
      messageTokens: 18000,
      messageThreshold: 30000,
      observationTokens: 2500,
      observationThreshold: 40000,
      generationCount: 0,
    });
  });

  it('reads a status part whose data is nested in the payload', () => {
    // Arrange
    const { type, data } = omStatusPart(6000, 1200);

    // Act
    const status = readMemoryStatus({ type, payload: { data } });

    // Assert
    expect(status?.observationTokens).toBe(1200);
  });

  it.each([
    ['a text delta', { type: 'text-delta', payload: { text: 'Realm details' } }],
    ['a status part without windows', { type: 'data-om-status', data: { threadId: 'thread-1' } }],
    ['a non-object chunk', 'data-om-status'],
  ])('ignores %s', (_description, chunk) => {
    // Act
    const status = readMemoryStatus(chunk);

    // Assert
    expect(status).toBeUndefined();
  });
});

describe('getConversationStatus', () => {
  it('is ok while memory has not summarised and the context window has room', () => {
    // Arrange
    const memoryStatus = readMemoryStatus(omStatusPart(21000, 0));

    // Act
    const status = getConversationStatus({ contextTokens: 27000, contextWindowTokens: CONTEXT_WINDOW, memoryStatus });

    // Assert
    expect(status).toEqual({ contextTokens: 27000, contextWindowTokens: CONTEXT_WINDOW, state: 'ok' });
  });

  it('gives a notice once observational memory has summarised older messages', () => {
    // Arrange
    const memoryStatus = readMemoryStatus(omStatusPart(6000, 2000));

    // Act
    const status = getConversationStatus({ contextTokens: 14000, contextWindowTokens: CONTEXT_WINDOW, memoryStatus });

    // Assert
    expect(status).toMatchObject({ state: 'notice', reason: 'summarised' });
  });

  it('warns once observational memory has condensed its notes', () => {
    // Arrange
    const memoryStatus = readMemoryStatus(omStatusPart(9000, 12000, 1));

    // Act
    const status = getConversationStatus({ contextTokens: 41000, contextWindowTokens: CONTEXT_WINDOW, memoryStatus });

    // Assert
    expect(status).toMatchObject({ state: 'warning', reason: 'notes-condensed' });
  });

  it('gives a notice with the message limit once the thread holds more messages than the agent reads', () => {
    // Act
    const status = getConversationStatus({
      contextTokens: 31000,
      contextWindowTokens: CONTEXT_WINDOW,
      history: { storedMessages: 21, lastMessages: 20 },
    });

    // Assert
    expect(status).toMatchObject({ state: 'notice', reason: 'older-messages-dropped', messageLimit: 20 });
  });

  it('is ok while the thread holds no more messages than the agent reads', () => {
    // Act
    const status = getConversationStatus({
      contextTokens: 31000,
      contextWindowTokens: CONTEXT_WINDOW,
      history: { storedMessages: 20, lastMessages: 20 },
    });

    // Assert
    expect(status.state).toBe('ok');
  });

  it('warns at 70% of the context window, ahead of any memory reason', () => {
    // Arrange
    const memoryStatus = readMemoryStatus(omStatusPart(6000, 2000));

    // Act
    const status = getConversationStatus({ contextTokens: 179200, contextWindowTokens: CONTEXT_WINDOW, memoryStatus });

    // Assert
    expect(status).toMatchObject({ state: 'warning', reason: 'near-context-limit' });
  });

  it('is ok just under 70% of the context window', () => {
    // Act
    const status = getConversationStatus({ contextTokens: 179199, contextWindowTokens: CONTEXT_WINDOW });

    // Assert
    expect(status.state).toBe('ok');
  });
});

describe('usesObservationalMemory', () => {
  it.each([
    [true, true],
    [{ model: 'gpt-5.1' }, true],
    [{ enabled: false }, false],
    [false, false],
    [undefined, false],
  ])('reads %p as %p', (config, expected) => {
    // Act
    const enabled = usesObservationalMemory(config);

    // Assert
    expect(enabled).toBe(expected);
  });
});
