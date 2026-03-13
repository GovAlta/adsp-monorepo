import { createSelector, createSlice } from '@reduxjs/toolkit';
import { AgentMessage, FilePart, ImagePart, Message, ResolvedFilePart, ResolvedImagePart, UserMessage } from '@core-services/app-common';
import { AppState } from './store';

export const AGENT_FEATURE_KEY = 'agent';

// Chunk types for socket.io streaming
const TEXT_DELTA = 'text-delta';
const TOOL_CALL = 'tool-call';
const TOOL_CALL_RESULT = 'tool-result';
const TOOL_CALL_ERROR = 'tool-error';
const REASONING_START = 'reasoning-start';
const REASONING_DELTA = 'reasoning-delta';
const REASONING_END = 'reasoning-end';
const ERROR = 'error';
const TRIPWIRE = 'tripwire';

interface TextDeltaChunk {
  type: typeof TEXT_DELTA;
  payload: { text: string };
}

interface ToolCallChunk {
  type: typeof TOOL_CALL;
  payload: { toolCallId: string; toolName: string };
}

interface ToolCallResultChunk {
  type: typeof TOOL_CALL_RESULT;
  payload: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
  };
}

interface ToolCallErrorChunk {
  type: typeof TOOL_CALL_ERROR;
  payload: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    error: unknown;
  };
}

interface ReasoningStartChunk {
  type: typeof REASONING_START;
  payload: { id: string };
}

interface ReasoningDeltaChunk {
  type: typeof REASONING_DELTA;
  payload: { id: string; text: string };
}

interface ReasoningEndChunk {
  type: typeof REASONING_END;
  payload: { id: string };
}

interface ErrorChunk {
  type: typeof ERROR;
  payload: { message: string; details?: unknown };
}

interface TripwireChunk {
  type: typeof TRIPWIRE;
  payload: { message: string; details?: unknown };
}

export type AgentChunk =
  | TextDeltaChunk
  | ToolCallChunk
  | ToolCallResultChunk
  | ToolCallErrorChunk
  | ReasoningStartChunk
  | ReasoningDeltaChunk
  | ReasoningEndChunk
  | ErrorChunk
  | TripwireChunk;

interface AgentState {
  messages: Message[];
}

const initialAgentState: AgentState = {
  messages: [],
};

const agentSlice = createSlice({
  name: AGENT_FEATURE_KEY,
  initialState: initialAgentState,
  reducers: {
    initializeMessage: (state, action) => {
      const message = action.payload as Message;
      // Check if message with this ID already exists
      const existingIndex = state.messages.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        state.messages[existingIndex] = message;
      } else {
        state.messages.push(message);
      }
    },
    updateMessage: (state, action) => {
      const { messageId, chunk } = action.payload as { messageId: string; chunk: AgentChunk };
      const message = state.messages.find((m) => m.id === messageId);
      // Only process chunks for agent messages
      if (message && message.from === 'agent') {
        processChunk(message as AgentMessage, chunk);
      }
    },
    completeMessage: (state, action) => {
      const messageId = action.payload as string;
      const message = state.messages.find((m) => m.id === messageId);
      if (message && message.from === 'agent') {
        (message as AgentMessage).streaming = false;
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

function processChunk(message: AgentMessage, chunk: AgentChunk): void {
  switch (chunk.type) {
    case TEXT_DELTA:
      message.content += chunk.payload.text;
      break;
    // Keep technical tool/reasoning details out of form-app chat state.
    // Form updates are handled in the container from tool-call-result chunks.
    case TOOL_CALL:
    case TOOL_CALL_RESULT:
    case TOOL_CALL_ERROR:
    case REASONING_START:
    case REASONING_DELTA:
    case REASONING_END:
      break;
    case ERROR:
    case TRIPWIRE: {
      if (!message.errors) {
        message.errors = [];
      }
      message.errors.push({
        type: chunk.type,
        message: chunk.payload.message,
      });
      break;
    }
  }
}

export const agentReducer = agentSlice.reducer;
export const agentActions = agentSlice.actions;

const resolveUserMessage = (message: UserMessage, downloadedFiles: Record<string, string>): UserMessage => {
  const content = message.content.map((part) => {
    if (part.type === 'image') {
      const imagePart = part as ImagePart;
      const imageData = downloadedFiles[imagePart.image];
      if (imageData) {
        return {
          ...imagePart,
          image: imageData,
        } as ResolvedImagePart;
      }
    } else if (part.type === 'file') {
      const filePart = part as FilePart;
      const fileData = downloadedFiles[filePart.data];
      if (fileData) {
        return {
          ...filePart,
          data: fileData,
        } as ResolvedFilePart;
      }
    }

    return part;
  });

  return {
    ...message,
    content,
  };
};

export const agentMessagesSelector = createSelector(
  (state: AppState) => state.agent.messages,
  (state: AppState) => state.file.files,
  (messages, downloadedFiles): Message[] =>
    messages.map((message) =>
      message.from === 'user' ? resolveUserMessage(message as UserMessage, downloadedFiles) : message
    )
);

export const agentMessageByIdSelector = createSelector(
  (state: AppState) => state.agent.messages,
  (_, messageId: string) => messageId,
  (messages: Message[], messageId) => messages.find((m) => m.id === messageId)
);
