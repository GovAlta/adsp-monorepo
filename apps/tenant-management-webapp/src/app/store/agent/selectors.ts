import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const agentConnectedSelector = (state: RootState) => state.agent.connected;
export const threadSelector = createSelector(
  (state: RootState) => state.agent.threads,
  (_: RootState, threadId: string) => threadId,
  (threads, threadId) => threads[threadId]
);

export const messagesSelector = createSelector(
  (state: RootState) => state.agent.threadMessages,
  (state: RootState) => state.agent.messages,
  (_: RootState, threadId: string) => threadId,
  (threadMessages, messages, threadId) => {
    const messageIds = threadMessages[threadId] || [];
    return messageIds.map((messageId) => messages[messageId]);
  }
);
