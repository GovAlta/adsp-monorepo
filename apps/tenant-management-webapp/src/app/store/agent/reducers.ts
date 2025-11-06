import { v4 as uuid } from 'uuid';
import {
  AGENT_RESPONSE_ACTION,
  AgentActionTypes,
  CONNECT_AGENT_ACTION,
  CONNECT_AGENT_SUCCESS_ACTION,
  DELETE_AGENT_SUCCESS_ACTION,
  DISCONNECT_AGENT_ACTION,
  DISCONNECT_AGENT_SUCCESS_ACTION,
  EDIT_AGENT_ACTION,
  GET_AGENTS_ACTION,
  GET_AGENTS_SUCCESS_ACTION,
  MESSAGE_AGENT_ACTION,
  NEW_PREVIEW_THREAD_ACTION,
  START_EDIT_AGENT_ACTION,
  START_THREAD_ACTION,
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
        messages[action.messageId] = {
          id: action.messageId,
          threadId: action.threadId,
          content: action.content,
          from: 'agent',
          streaming: !action.done,
        };
      } else {
        const message = messages[action.messageId];
        messages[action.messageId] = {
          ...message,
          content: message.content + action.content,
          streaming: !action.done,
        };
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
