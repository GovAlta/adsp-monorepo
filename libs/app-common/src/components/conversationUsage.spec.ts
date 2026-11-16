import {
  contextPercent,
  describeConversationStatus,
  describeUsage,
  formatContextTokens,
  formatTokens,
} from './conversationUsage';

const CONTEXT = { contextTokens: 14281, contextWindowTokens: 256000 };

describe('formatTokens', () => {
  it.each([
    [850, '850'],
    [1000, '1k'],
    [9400, '9.4k'],
    [36000, '36k'],
    [111499, '111k'],
    [1250000, '1.3M'],
  ])('shows %p tokens as %p', (tokens, expected) => {
    // Act
    const text = formatTokens(tokens);

    // Assert
    expect(text).toBe(expected);
  });
});

describe('formatContextTokens', () => {
  it.each([
    [850, '850'],
    [8409, '8.4k'],
    [14281, '14.3k'],
    [36000, '36k'],
    [179200, '179.2k'],
    [256000, '256k'],
  ])('shows %p context tokens as %p', (tokens, expected) => {
    // Act
    const text = formatContextTokens(tokens);

    // Assert
    expect(text).toBe(expected);
  });
});

describe('contextPercent', () => {
  it('rounds the share of the context window to a whole percentage', () => {
    // Act
    const percent = contextPercent({ contextTokens: 36000, contextWindowTokens: 256000 });

    // Assert
    expect(percent).toBe(14);
  });

  it('is 0 when the context window is unknown', () => {
    // Act
    const percent = contextPercent({ contextTokens: 36000, contextWindowTokens: 0 });

    // Assert
    expect(percent).toBe(0);
  });

  it('never goes past 100', () => {
    // Act
    const percent = contextPercent({ contextTokens: 300000, contextWindowTokens: 256000 });

    // Assert
    expect(percent).toBe(100);
  });
});

describe('describeUsage', () => {
  it('describes the tokens and model calls of a reply', () => {
    // Act
    const text = describeUsage({
      contextTokens: 36000,
      contextWindowTokens: 256000,
      totalTokens: 111000,
      outputTokens: 1400,
      modelCalls: 3,
    });

    // Assert
    expect(text).toBe('About 111k tokens · 3 model calls');
  });

  it('uses the singular for a reply with one model call', () => {
    // Act
    const text = describeUsage({
      contextTokens: 9000,
      contextWindowTokens: 256000,
      totalTokens: 9400,
      outputTokens: 400,
      modelCalls: 1,
    });

    // Assert
    expect(text).toBe('About 9.4k tokens · 1 model call');
  });
});

describe('describeConversationStatus', () => {
  it('has nothing to say while the conversation is ok', () => {
    // Act
    const text = describeConversationStatus({ ...CONTEXT, state: 'ok' });

    // Assert
    expect(text).toBeUndefined();
  });

  it('says earlier messages were summarised', () => {
    // Act
    const text = describeConversationStatus({ ...CONTEXT, state: 'notice', reason: 'summarised' });

    // Assert
    expect(text).toEqual({
      heading: 'Earlier messages summarised',
      shortHeading: 'Summarised',
      detail: 'Details from early in the chat may be missed.',
    });
  });

  it('names the message limit once older messages are dropped', () => {
    // Act
    const text = describeConversationStatus({
      ...CONTEXT,
      state: 'notice',
      reason: 'older-messages-dropped',
      messageLimit: 20,
    });

    // Assert
    expect(text).toEqual({
      heading: 'Using your last 20 messages',
      shortHeading: 'Last 20 messages',
      detail: 'Earlier requests in this chat may be forgotten.',
    });
  });

  it.each([
    ['near-context-limit', 'fills most of the assistant’s context window'],
    ['notes-condensed', 'condensed its notes of this long conversation'],
  ] as const)('warns about the assistant’s limit for %s', (reason, detail) => {
    // Act
    const text = describeConversationStatus({ ...CONTEXT, state: 'warning', reason });

    // Assert
    expect(text?.heading).toBe('Close to the assistant’s limit');
    expect(text?.detail).toContain(detail);
  });

  it('suggests a new chat once the conversation is long enough to use more of the shared AI capacity', () => {
    // Act
    const text = describeConversationStatus({ ...CONTEXT, state: 'notice', reason: 'long-conversation' });

    // Assert
    expect(text).toEqual({
      heading: 'Long conversation',
      shortHeading: 'Long chat',
      detail: 'Long chats use more of the shared AI capacity. Start a new chat for a new question.',
    });
  });

  it('has nothing to say without a status', () => {
    // Act
    const text = describeConversationStatus(undefined);

    // Assert
    expect(text).toBeUndefined();
  });
});
