import { createSelector, createSlice } from '@reduxjs/toolkit';
import { AgentMessage, Message, ToolCall, UserMessage } from '@core-services/app-common';
import { AppState } from './store';

export const AGENT_FEATURE_KEY = 'agent';

const DEFAULT_CONNECTION_STATUS = 'Waiting for sign-in';
const DEFAULT_WORKSPACE_STATUS = 'Not connected';

interface StreamChunk {
  type: string;
  payload?: unknown;
}

export interface BuilderAgentStreamEvent {
  messageId: string;
  replyTo?: string;
  done?: boolean;
  content?: string;
  output?: unknown;
  chunk?: StreamChunk;
}

export interface AgentState {
  messages: Message[];
  connectionStatus: string;
  workspaceStatus: string;
  isSocketConnected: boolean;
  isWorkspaceRefreshing: boolean;
}

interface StreamDelta {
  text?: string;
  reasoning?: string;
  toolCall?: ToolCall;
  toolResult?: Pick<ToolCall, 'toolCallId' | 'toolName' | 'result'>;
  toolError?: Pick<ToolCall, 'toolCallId' | 'toolName' | 'error'>;
  agentError?: { type: 'error' | 'tripwire'; message: string };
}

const initialState: AgentState = {
  messages: [],
  connectionStatus: DEFAULT_CONNECTION_STATUS,
  workspaceStatus: DEFAULT_WORKSPACE_STATUS,
  isSocketConnected: false,
  isWorkspaceRefreshing: false,
};

function formatPayload(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return '';
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function extractChunkText(chunk?: StreamChunk): StreamDelta {
  if (!chunk) {
    return {};
  }

  const payload = chunk.payload as Record<string, unknown> | string | undefined;
  const fromPayload = (keys: string[]) => {
    if (typeof payload === 'string') {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const key = keys.find((entry) => typeof payload[entry] === 'string');
    return key ? String(payload[key]) : undefined;
  };

  const toolCallId =
    payload && typeof payload === 'object' && typeof payload.toolCallId === 'string' ? payload.toolCallId : undefined;
  const toolName =
    payload && typeof payload === 'object' && typeof payload.toolName === 'string' ? payload.toolName : undefined;

  const getToolCallBase = () => {
    if (!toolCallId || !toolName) {
      return undefined;
    }

    return { toolCallId, toolName };
  };

  switch (chunk.type) {
    case 'text-delta':
      return { text: fromPayload(['text', 'textDelta', 'delta', 'content']) };
    case 'reasoning-delta':
      return { reasoning: fromPayload(['text', 'textDelta', 'delta', 'content']) };
    case 'reasoning-start':
      return { reasoning: 'Thinking...\n' };
    case 'reasoning-end':
      return { reasoning: '\n' };
    case 'tool-call': {
      const base = getToolCallBase();
      const args =
        payload &&
        typeof payload === 'object' &&
        payload.args &&
        typeof payload.args === 'object' &&
        !Array.isArray(payload.args)
          ? (payload.args as Record<string, unknown>)
          : {};
      return base ? { toolCall: { ...base, args } } : {};
    }
    case 'tool-result': {
      const base = getToolCallBase();
      const result = payload && typeof payload === 'object' && 'result' in payload ? payload.result : undefined;
      return base ? { toolResult: { ...base, result } } : {};
    }
    case 'tool-error': {
      const base = getToolCallBase();
      const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : 'Tool call failed.';
      return base ? { toolError: { ...base, error } } : {};
    }
    case 'error':
      return { agentError: { type: 'error', message: formatPayload(payload) } };
    case 'tripwire':
      return { agentError: { type: 'tripwire', message: formatPayload(payload) } };
    default:
      return {};
  }
}

function upsertToolCall(
  toolCalls: ToolCall[],
  next: Partial<ToolCall> & Pick<ToolCall, 'toolCallId' | 'toolName'>,
): ToolCall[] {
  const index = toolCalls.findIndex((toolCall) => toolCall.toolCallId === next.toolCallId);
  if (index < 0) {
    return [
      ...toolCalls,
      {
        toolCallId: next.toolCallId,
        toolName: next.toolName,
        args: (next.args as Record<string, unknown>) ?? {},
        error: next.error,
        result: next.result,
      },
    ];
  }

  return toolCalls.map((toolCall, toolCallIndex) =>
    toolCallIndex === index
      ? {
          ...toolCall,
          ...(next.args !== undefined ? { args: next.args as Record<string, unknown> } : {}),
          ...(next.result !== undefined ? { result: next.result } : {}),
          ...(next.error !== undefined ? { error: next.error } : {}),
        }
      : toolCall,
  );
}

const agentSlice = createSlice({
  name: AGENT_FEATURE_KEY,
  initialState,
  reducers: {
    initializeMessage: (state, action: { payload: Message }) => {
      const message = action.payload;
      const existingIndex = state.messages.findIndex((entry) => entry.id === message.id);
      if (existingIndex >= 0) {
        state.messages[existingIndex] = message;
      } else {
        state.messages.push(message);
      }
    },
    applyStreamEvent: (state, action: { payload: { threadId: string; event: BuilderAgentStreamEvent } }) => {
      const { threadId, event } = action.payload;
      const delta = extractChunkText(event.chunk);
      const messageIndex = state.messages.findIndex((entry) => entry.id === event.messageId && entry.from === 'agent');
      const existing = (messageIndex >= 0 ? state.messages[messageIndex] : undefined) as AgentMessage | undefined;

      const agentMessage: AgentMessage = existing
        ? existing
        : {
            id: event.messageId,
            threadId,
            from: 'agent',
            content: '',
            toolCalls: [],
            streaming: !(event.done ?? false),
          };

      if (delta.text || event.content) {
        agentMessage.content = `${agentMessage.content}${delta.text ?? event.content ?? ''}`;
      }

      if (delta.reasoning) {
        agentMessage.reasoning = {
          id: agentMessage.reasoning?.id ?? `${agentMessage.id}:reasoning`,
          streaming: !(event.done ?? false),
          content: `${agentMessage.reasoning?.content ?? ''}${delta.reasoning}`,
        };
      } else if (agentMessage.reasoning && event.done !== undefined) {
        agentMessage.reasoning.streaming = !event.done;
      }

      if (delta.toolCall) {
        agentMessage.toolCalls = upsertToolCall(agentMessage.toolCalls ?? [], delta.toolCall);
      }
      if (delta.toolResult) {
        agentMessage.toolCalls = upsertToolCall(agentMessage.toolCalls ?? [], delta.toolResult);
      }
      if (delta.toolError) {
        agentMessage.toolCalls = upsertToolCall(agentMessage.toolCalls ?? [], delta.toolError);
      }
      if (delta.agentError) {
        agentMessage.errors = [...(agentMessage.errors ?? []), delta.agentError];
      }
      if (event.output !== undefined) {
        agentMessage.output = event.output;
      }
      if (event.done !== undefined) {
        agentMessage.streaming = !event.done;
      }

      if (messageIndex >= 0) {
        state.messages[messageIndex] = agentMessage;
      } else {
        state.messages.push(agentMessage);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setConnectionStatus: (state, action: { payload: string }) => {
      state.connectionStatus = action.payload;
    },
    setWorkspaceStatus: (state, action: { payload: string }) => {
      state.workspaceStatus = action.payload;
    },
    setSocketConnected: (state, action: { payload: boolean }) => {
      state.isSocketConnected = action.payload;
    },
    setWorkspaceRefreshing: (state, action: { payload: boolean }) => {
      state.isWorkspaceRefreshing = action.payload;
    },
    resetSessionState: (state) => {
      state.connectionStatus = DEFAULT_CONNECTION_STATUS;
      state.workspaceStatus = DEFAULT_WORKSPACE_STATUS;
      state.isSocketConnected = false;
      state.isWorkspaceRefreshing = false;
    },
  },
});

export const agentReducer = agentSlice.reducer;
export const agentActions = agentSlice.actions;

export const agentMessagesSelector = (state: AppState): Message[] => state.agent.messages;
export const agentConnectionStatusSelector = (state: AppState): string => state.agent.connectionStatus;
export const agentWorkspaceStatusSelector = (state: AppState): string => state.agent.workspaceStatus;
export const agentSocketConnectedSelector = (state: AppState): boolean => state.agent.isSocketConnected;
export const agentWorkspaceRefreshingSelector = (state: AppState): boolean => state.agent.isWorkspaceRefreshing;

export const agentMessagesByThreadSelector = createSelector(
  [agentMessagesSelector, (_: AppState, threadId: string) => threadId],
  (messages, threadId) => messages.filter((message) => message.threadId === threadId),
);

export const agentMessageByIdSelector = createSelector(
  [agentMessagesSelector, (_: AppState, messageId: string) => messageId],
  (messages, messageId) => messages.find((message) => message.id === messageId),
);

export type BuilderAgentMessage = AgentMessage | UserMessage;
export const agentInitialState = initialState;
