import { type Message } from '@core-services/app-common';

/**
 * Whether the agent is working on, or about to reply to, the latest message. A message from the user, or
 * a system message sent to the agent, is awaiting a reply until an agent message follows it. Slash commands
 * add their own reply, so they leave the agent idle.
 */
export function isAgentBusy(messages: Message[]): boolean {
  const last = messages[messages.length - 1];
  if (!last) {
    return false;
  }

  return last.from === 'agent' ? last.streaming : true;
}
