import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

export const agentConnectedSelector = (state: RootState) => state.agent.connected;
export const busySelector = (state: RootState) => state.agent.busy;
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

export const agentsSelector = createSelector(
  (state: RootState) => state.agent.agents,
  (_: RootState, core: boolean) => core,
  (agents, core) => Object.values(agents).filter((agent) => !!agent.core === core)
);

export const agentNamesSelector = createSelector(
  (state: RootState) => state.agent.agents,
  (agents) => Object.values(agents).map(({ name }) => name)
);

export const editorSelector = (state: RootState) => state.agent.editor;

export const availableToolsSelector = (state: RootState) => state.agent.availableTools;
