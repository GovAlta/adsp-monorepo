import {
  AGENT_RESPONSE_ACTION,
  AgentActionTypes,
  CONNECT_AGENT_ACTION,
  CONNECT_AGENT_SUCCESS_ACTION,
  DISCONNECT_AGENT_ACTION,
  DISCONNECT_AGENT_SUCCESS_ACTION,
  MESSAGE_AGENT_ACTION,
  START_THREAD_ACTION,
} from './actions';
import { AgentState } from './model';

const defaultState: AgentState = {
  connected: false,
  threads: {},
  threadMessages: {},
  messages: {},
  busy: {
    connecting: false,
    disconnecting: false,
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
    default:
      return state;
  }
}
