import type { Message } from '@core-services/app-common';
import { countQuestions, isAwaitingReply, mayStillBeSavingReply } from './chatState';

function userMessage(id: string, overrides: Record<string, unknown> = {}): Message {
  return { id, threadId: 'thread-1', from: 'user', content: [{ type: 'text', text: id }], ...overrides } as Message;
}

function agentMessage(id: string, streaming = false, interrupted?: boolean): Message {
  return { id, threadId: 'thread-1', from: 'agent', content: id, streaming, toolCalls: [], interrupted } as Message;
}

describe('isAwaitingReply', () => {
  it('is false for an empty chat or one whose last reply has finished', () => {
    expect(isAwaitingReply([])).toBe(false);
    expect(isAwaitingReply([userMessage('question'), agentMessage('answer')])).toBe(false);
  });

  it('is true while the last question has no reply yet', () => {
    expect(isAwaitingReply([userMessage('first'), agentMessage('answer'), userMessage('second')])).toBe(true);
  });

  it('is true while a reply is still streaming', () => {
    expect(isAwaitingReply([userMessage('question'), agentMessage('answer', true)])).toBe(true);
  });
});

describe('mayStillBeSavingReply', () => {
  it('is false once every reply has finished', () => {
    expect(mayStillBeSavingReply([])).toBe(false);
    expect(mayStillBeSavingReply([userMessage('question'), agentMessage('answer')])).toBe(false);
  });

  it('is true while a reply is awaited or streaming', () => {
    expect(mayStillBeSavingReply([userMessage('question')])).toBe(true);
    expect(mayStillBeSavingReply([userMessage('question'), agentMessage('answer', true)])).toBe(true);
  });

  it('is true when a reply was cut off by a reconnect, although it no longer looks in progress', () => {
    const messages = [
      userMessage('first'),
      agentMessage('cut off', false, true),
      userMessage('second'),
      agentMessage('answer'),
    ];

    expect(isAwaitingReply(messages)).toBe(false);
    expect(mayStillBeSavingReply(messages)).toBe(true);
  });
});

describe('countQuestions', () => {
  it('counts the questions the user asked, not replies or system messages', () => {
    expect(
      countQuestions([
        userMessage('first'),
        agentMessage('answer'),
        userMessage('notice', { local: true }),
        userMessage('second'),
      ]),
    ).toBe(2);
  });
});
