import { AgentMessage, ToolCall } from '@core-services/app-common';
import {
  AGENT_RESPONSE_ACTION,
  AgentActionTypes,
  AgentResponseAction,
  CONNECT_AGENT_ACTION,
  CONNECT_AGENT_SUCCESS_ACTION,
  DELETE_AGENT_SUCCESS_ACTION,
  DISCONNECT_AGENT_ACTION,
  DISCONNECT_AGENT_SUCCESS_ACTION,
  EDIT_AGENT_ACTION,
  ERROR,
  GET_AGENTS_ACTION,
  GET_AGENTS_SUCCESS_ACTION,
  MESSAGE_AGENT_ACTION,
  NEW_PREVIEW_THREAD_ACTION,
  REASONING_DELTA,
  REASONING_END,
  REASONING_START,
  START_EDIT_AGENT_ACTION,
  START_THREAD_ACTION,
  TEXT_DELTA,
  TOOL_CALL,
  TOOL_CALL_ERROR,
  TOOL_CALL_RESULT,
  TRIPWIRE,
  UPDATE_AGENT_ACTION,
  UPDATE_AGENT_SUCCESS_ACTION,
} from './actions';
import { AgentState } from './model';

const defaultState: AgentState = {
  connected: false,
  threads: {},
  threadMessages: {},
  messages: {},
  availableTools: [
    {
      id: 'fileDownloadTool',
      description:
        'Tool for downloading files from the file service using a UUID or ADSP URN.' +
        ' Note that binary files generally cannot be processed by models.',
    },
    {
      id: 'schemaDefinitionTool',
      description:
        'Tool for getting ADSP JSON schemas https://adsp.alberta.ca/standard.v1.schema.json' +
        ' and https://adsp.alberta.ca/common.v1.schema.json',
    },
    {
      id: 'formConfigurationRetrievalTool',
      description:
        'Tool for getting Form Definition configuration. Note that formDefinitionId is ' +
        'passed via the runtime context rather than via the input.',
    },
    {
      id: 'formConfigurationUpdateTool',
      description:
        'Tool for updating Form Definition configuration. Note that formDefinitionId is ' +
        'passed via the runtime context rather than via the input.',
    },
    {
      id: 'rendererCatalogTool',
      description:
        'Tool for validating that schema and UI combinations have matching JSONForms renderers. ' +
        'Returns matching renderers with their constraints and provides fallback guidance when no renderer is available.',
    },
  ],
  agents: {},
  editor: {
    agent: null,
    threadId: null,
    hasChanges: false,
    stalePreview: false,
  },
  busy: {
    connecting: false,
    disconnecting: false,
    loading: false,
    saving: false,
  },
};

function processResponseChunk(message: AgentMessage, action: AgentResponseAction): AgentMessage {
  switch (action.chunk?.type) {
    case TEXT_DELTA:
      return {
        ...message,
        content: message.content + action.chunk.payload.text,
        streaming: !action.done,
      }
    case TOOL_CALL:
      // Tool is being invoked - create pending entry
      return {
        ...message,
        toolCalls: [
          ...message.toolCalls,
          {
            toolCallId: action.chunk.payload.toolCallId,
            toolName: action.chunk.payload.toolName,
            args: {},
          }
        ]
      }
    case TOOL_CALL_RESULT: {
      // Update existing tool call with result, or add new one if not found
      if (!action.chunk || action.chunk.type !== TOOL_CALL_RESULT) return message;
      
      const { toolCallId, toolName, args, result } = action.chunk.payload;
      const existingResultIndex = message.toolCalls.findIndex(
        (tc: ToolCall) => tc.toolCallId === toolCallId
      );
      if (existingResultIndex >= 0) {
        const updatedToolCalls = [...message.toolCalls];
        updatedToolCalls[existingResultIndex] = {
          ...updatedToolCalls[existingResultIndex],
          args,
          result,
        };
        return { ...message, toolCalls: updatedToolCalls };
      } else {
        return {
          ...message,
          toolCalls: [
            ...message.toolCalls,
            {
              toolCallId,
              toolName,
              args,
              result,
            }
          ]
        };
      }
    }
    case TOOL_CALL_ERROR: {
      // Update existing tool call with error, or add new one if not found
      if (!action.chunk || action.chunk.type !== TOOL_CALL_ERROR) return message;
      
      const { toolCallId, toolName, args, error } = action.chunk.payload;
      const existingErrorIndex = message.toolCalls.findIndex(
        (tc: ToolCall) => tc.toolCallId === toolCallId
      );
      if (existingErrorIndex >= 0) {
        const updatedToolCalls = [...message.toolCalls];
        updatedToolCalls[existingErrorIndex] = {
          ...updatedToolCalls[existingErrorIndex],
          args,
          error,
        };
        return { ...message, toolCalls: updatedToolCalls };
      } else {
        return {
          ...message,
          toolCalls: [
            ...message.toolCalls,
            {
              toolCallId,
              toolName,
              args,
              error,
            }
          ]
        };
      }
    }
    case REASONING_START:
      return {
        ...message,
        reasoning: {
          id: action.chunk.payload.id,
          streaming: true,
          content: ''
        }
      }
    case REASONING_DELTA:
      return {
        ...message,
        reasoning: action.chunk.payload.id === message.reasoning.id ? {
          ...message.reasoning,
          content: message.reasoning.content + action.chunk.payload.text
        } : message.reasoning
      }
    case REASONING_END:
      return {
        ...message,
        reasoning: action.chunk.payload.id === message.reasoning.id ? {
          ...message.reasoning,
          streaming: false
        } : message.reasoning
      }
    case ERROR:
    case TRIPWIRE: {
      // Add error to the errors array
      if (!action.chunk || (action.chunk.type !== ERROR && action.chunk.type !== TRIPWIRE)) return message;
      
      return {
        ...message,
        errors: [
          ...(message.errors || []),
          {
            type: action.chunk.type,
            message: action.chunk.payload.message,
            details: action.chunk.payload.details,
          }
        ]
      };
    }
    default:
      return message;
  }
}

export default function (state: AgentState = defaultState, action: AgentActionTypes): AgentState {
  switch (action.type) {
    case CONNECT_AGENT_ACTION:
      return {
        ...state,
        busy: { ...state.busy, connecting: true },
      };
    case CONNECT_AGENT_SUCCESS_ACTION:
      return {
        ...state,
        connected: true,
        busy: { ...state.busy, connecting: false },
      };
    case DISCONNECT_AGENT_ACTION:
      return {
        ...state,
        busy: { ...state.busy, disconnecting: true },
      };
    case DISCONNECT_AGENT_SUCCESS_ACTION:
      return {
        ...state,
        connected: false,
        busy: { ...state.busy, disconnecting: true },
      };
    case START_THREAD_ACTION:
      return {
        ...state,
        threads: {
          ...state.threads,
          [action.threadId]: {
            id: action.threadId,
            agent: action.agent,
          },
        },
      };
    case MESSAGE_AGENT_ACTION:
      return {
        ...state,
        threadMessages: {
          ...state.threadMessages,
          [action.threadId]: [...(state.threadMessages[action.threadId] || []), action.messageId],
        },
        messages: {
          ...state.messages,
          [action.messageId]: {
            id: action.messageId,
            threadId: action.threadId,
            content: action.content,
            from: 'user',
          },
        },
      };
    case AGENT_RESPONSE_ACTION: {
      const threadMessages = { ...state.threadMessages };
      const messages = { ...state.messages };
      if (!state.threadMessages[action.threadId].includes(action.messageId)) {
        threadMessages[action.threadId].push(action.messageId);
        messages[action.messageId] = processResponseChunk({
          id: action.messageId,
          threadId: action.threadId,
          from: 'agent',
          content: '',
          toolCalls: [],
          streaming: true,
        }, action);
      } else {
        const message = messages[action.messageId];
        messages[action.messageId] = processResponseChunk(message as AgentMessage, action);
      }
      return { ...state, threadMessages, messages };
    }
    case GET_AGENTS_ACTION:
      return { ...state, busy: { ...state.busy, loading: true } };
    case GET_AGENTS_SUCCESS_ACTION:
      return {
        ...state,
        agents: action.agents.reduce((agents, agent) => ({ ...agents, [agent.id]: agent }), {}),
        busy: { ...state.busy, loading: false },
      };
    case UPDATE_AGENT_ACTION:
      return {
        ...state,
        busy: { ...state.busy, saving: true },
      };
    case UPDATE_AGENT_SUCCESS_ACTION:
      return {
        ...state,
        agents: { ...state.agents, [action.agent.id]: action.agent },
        busy: { ...state.busy, saving: false },
        editor:
          state.editor.agent?.id === action.agent.id
            ? {
              ...state.editor,
              agent: action.agent,
              hasChanges: false,
            }
            : state.editor,
      };
    case DELETE_AGENT_SUCCESS_ACTION: {
      const agents = state.agents;
      delete agents[action.id];
      return {
        ...state,
        agents,
      };
    }
    case START_EDIT_AGENT_ACTION: {
      return {
        ...state,
        editor: {
          ...state.editor,
          agent: action.agent,
          hasChanges: false,
        },
      };
    }
    case EDIT_AGENT_ACTION: {
      return {
        ...state,
        editor: {
          ...state.editor,
          agent: action.agent,
          stalePreview: true,
          hasChanges: true,
        },
      };
    }
    case NEW_PREVIEW_THREAD_ACTION: {
      return {
        ...state,
        editor: {
          ...state.editor,
          threadId: action.threadId,
          stalePreview: false,
        },
      };
    }
    default:
      return state;
  }
}
