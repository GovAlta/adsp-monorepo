import { type Message } from '@core-services/app-common';
import { isAgentBusy } from './previewErrors';

const user = (local?: boolean): Message => ({
  id: 'u',
  threadId: 't',
  from: 'user',
  content: [{ type: 'text', text: 'hi' }],
  ...(local ? { local } : {}),
});
const agent = (streaming: boolean, local?: boolean): Message => ({
  id: 'a',
  threadId: 't',
  from: 'agent',
  content: 'reply',
  toolCalls: [],
  streaming,
  ...(local ? { local } : {}),
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

  it('is busy after a system message that was sent to the agent', () => {
    expect(isAgentBusy([user(), agent(false), user(true)])).toBe(true);
  });

  it('is idle after a slash command, whose local reply follows the echo', () => {
    expect(isAgentBusy([user(), agent(false), user(true), agent(false, true)])).toBe(false);
  });
});
