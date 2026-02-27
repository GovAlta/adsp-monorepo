import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { ImagePart, FilePart, UserMessage, ResolvedImagePart, ResolvedFilePart } from '@core-services/app-common';

// Helper to extract file ID from file service URN
// Format: urn:ads:platform:file-service:v1:/files/{uuid}
const extractFileIdFromUrn = (urn: string): string | null => {
  if (!urn || !urn.includes('file-service')) {
    return null;
  }
  const match = urn.match(/\/files\/([a-f0-9\-]+)$/i);
  return match ? match[1] : null;
};

// Helper to resolve a user message with cached file data and metadata
const resolveUserMessage = (
  message: UserMessage,
  downloadedFiles: Record<string, string>,
  fileMetadata: Record<string, { filename?: string; mimeType?: string }>
) => {
  const resolvedContent = message.content.map((part) => {
    if (part.type === 'image') {
      const imagePart = part as ImagePart;
      const fileId = extractFileIdFromUrn(imagePart.image);
      if (fileId && downloadedFiles[fileId]) {
        const metadata = fileMetadata[fileId];
        return {
          ...imagePart,
          image: downloadedFiles[fileId], // Use cached data URL instead of URN
          filename: metadata?.filename,
          mediaType: metadata?.mimeType,
        } as ResolvedImagePart;
      }
    } else if (part.type === 'file') {
      const filePart = part as FilePart;
      const fileId = extractFileIdFromUrn(filePart.data);
      if (fileId && downloadedFiles[fileId]) {
        const metadata = fileMetadata[fileId];
        return {
          ...filePart,
          data: downloadedFiles[fileId], // Use cached data URL instead of URN
          filename: metadata?.filename,
          mediaType: metadata?.mimeType,
        } as ResolvedFilePart;
      }
    }
    return part;
  });

  return {
    ...message,
    content: resolvedContent,
  };
};

export const agentConnectedSelector = (state: RootState) => state.agent.connected;
export const busySelector = (state: RootState) => state.agent.busy;

// Memoized metadata selector to avoid recomputation when fileList reference changes
const fileMetadataSelector = createSelector(
  (state: RootState) => state.fileService?.fileList || [],
  (fileList) => {
    return fileList.reduce((acc, file) => {
      if (file.id) {
        acc[file.id] = { filename: file.filename, mimeType: file.mimeType };
      }
      return acc;
    }, {} as Record<string, { filename?: string; mimeType?: string }>);
  }
);

export const threadSelector = createSelector(
  (state: RootState) => state.agent.threads,
  (_: RootState, threadId: string) => threadId,
  (threads, threadId) => threads[threadId]
);

export const messagesSelector = createSelector(
  (state: RootState) => state.agent.threadMessages,
  (state: RootState) => state.agent.messages,
  (state: RootState) => state.fileService?.downloadedFiles || {},
  fileMetadataSelector,
  (_: RootState, threadId: string) => threadId,
  (threadMessages, messages, downloadedFiles, fileMetadata, threadId) => {
    const messageIds = threadMessages[threadId] || [];
    return messageIds.map((messageId) => {
      const message = messages[messageId];
      // Resolve user messages with cached file data and metadata
      if (message.from === 'user') {
        return resolveUserMessage(message as UserMessage, downloadedFiles, fileMetadata);
      }
      return message;
    });
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

export const availableAgentsSelector = createSelector(
  editorSelector,
  (state: RootState) => state.agent.agents,
  ({ agent }, availableAgents) =>
    Object.values(availableAgents).filter((candidate) => candidate.id !== agent?.id && !candidate.agents?.length)
);

export const agentAgentsSelector = createSelector(
  editorSelector,
  availableAgentsSelector,
  ({ agent }, availableAgents) =>
    agent?.agents?.map((agent) => availableAgents.find(({ id }) => id === agent)).filter((agent) => !!agent) || []
);
