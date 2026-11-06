import type { UserMessage } from '@core-services/app-common';
import type { StoredAgentMessage } from './model';

type ChatMessage = UserMessage | StoredAgentMessage;

/**
 * Whether the agent has not finished replying: the last message is the user's, or an agent reply is still streaming.
 */
export function isAwaitingReply(messages: ChatMessage[]): boolean {
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.from === 'user' || messages.some((message) => message.from === 'agent' && message.streaming);
}

/**
 * Whether agent-service may still be saving a reply to the thread, so deleting it now could leave data behind.
 * Besides a reply in progress, that includes a reply cut off by a reconnect: it looks finished here, but the server
 * may still be generating it.
 */
export function mayStillBeSavingReply(messages: ChatMessage[]): boolean {
  return (
    isAwaitingReply(messages) || messages.some((message) => message.from === 'agent' && message.interrupted === true)
  );
}
