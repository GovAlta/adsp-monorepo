import { type Message } from '@core-services/app-common';

/**
 * Whether the agent is working on, or about to reply to, the latest user message. Local messages
 * (e.g. slash commands) are never sent to the agent, so they do not count.
 */
export function isAgentBusy(messages: Message[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) {
    return false;
  }

  return last.from === 'agent' ? last.streaming : !last.local;
}
