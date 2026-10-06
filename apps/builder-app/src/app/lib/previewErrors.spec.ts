import { type Message } from '@core-services/app-common';
import { isAgentBusy } from './previewErrors';

const user = (local?: boolean): Message => ({
  id: 'u',
  threadId: 't',
  from: 'user',
  content: [{ type: 'text', text: 'hi' }],
  ...(local ? { local } : {}),
});
const agent = (streaming: boolean): Message => ({
  id: 'a',
  threadId: 't',
  from: 'agent',
  content: 'reply',
  toolCalls: [],
  streaming,
});

describe('isAgentBusy', () => {
  it('is not busy without messages', () => {
    expect(isAgentBusy([])).toBe(false);
  });

  it('is busy while the agent reply is streaming', () => {
    expect(isAgentBusy([user(), agent(true)])).toBe(true);
  });

  it('is not busy once the agent has finished replying', () => {
    expect(isAgentBusy([user(), agent(false)])).toBe(false);
  });

  it('is busy while waiting for the agent to reply to a user message', () => {
    expect(isAgentBusy([agent(false), user()])).toBe(true);
  });

  it('ignores local messages that never go to the agent', () => {
    expect(isAgentBusy([user(), agent(false), user(true)])).toBe(false);
  });
});
