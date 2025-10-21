import { Dispatch } from 'redux';
import { io, Socket } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { RootState } from '../index';

export const CONNECT_AGENT_ACTION = 'agent/CONNECT_AGENT';
export const CONNECT_AGENT_SUCCESS_ACTION = 'agent/CONNECT_AGENT_SUCCESS';
export const DISCONNECT_AGENT_ACTION = 'agent/DISCONNECT_AGENT';
export const DISCONNECT_AGENT_SUCCESS_ACTION = 'agent/DISCONNECT_AGENT_SUCCESS';

export const START_THREAD_ACTION = 'agent/START_THREAD';
export const MESSAGE_AGENT_ACTION = 'agent/MESSAGE_AGENT';
export const AGENT_RESPONSE_ACTION = 'agent/AGENT_RESPONSE';

export interface ConnectAgentAction {
  type: typeof CONNECT_AGENT_ACTION;
}

export interface ConnectAgentSuccessAction {
  type: typeof CONNECT_AGENT_SUCCESS_ACTION;
}

export interface DisconnectAgentAction {
  type: typeof DISCONNECT_AGENT_ACTION;
}

export interface DisconnectAgentSuccessAction {
  type: typeof DISCONNECT_AGENT_SUCCESS_ACTION;
}

export interface StartThreadAction {
  type: typeof START_THREAD_ACTION;
  threadId: string;
  agent: string;
}

export interface MessageAgentAction {
  type: typeof MESSAGE_AGENT_ACTION;
  threadId: string;
  messageId: string;
  context: Record<string, unknown>;
  content: string;
}

export interface AgentResponseAction {
  type: typeof AGENT_RESPONSE_ACTION;
  threadId: string;
  messageId: string;
  content: string;
  done: boolean;
}

export type AgentActionTypes =
  | ConnectAgentAction
  | ConnectAgentSuccessAction
  | DisconnectAgentAction
  | DisconnectAgentSuccessAction
  | StartThreadAction
  | MessageAgentAction
  | AgentResponseAction;

// wrapping function for socket.on
let socket: Socket;
export function connectAgent() {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    dispatch({ type: CONNECT_AGENT_ACTION });

    if (socket?.connected) {
      socket.disconnect();
    }

    const { config, session } = getState();

    socket = io(config.serviceUrls?.agentServiceApiUrl || 'localhost:3380', {
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = session.credentials?.token;
          cb({ token });
        } catch (err) {
          // Token retrieval failed and connection (using auth result) will also fail after.
          cb(null as unknown as object);
        }
      },
    });

    socket.on('connect', () => {
      dispatch({ type: CONNECT_AGENT_SUCCESS_ACTION });
    });
    socket.on('disconnect', () => {
      dispatch({ type: DISCONNECT_AGENT_SUCCESS_ACTION });
    });
    socket.on('stream', (message) => {
      const { threadId, messageId, content, done } = message;
      dispatch({ type: AGENT_RESPONSE_ACTION, threadId, messageId, content: content || '', done });
    });
  };
}

export function disconnectAgent() {
  return async (dispatch: Dispatch) => {
    dispatch({ type: DISCONNECT_AGENT_ACTION });

    if (socket?.connected) {
      socket.disconnect();
    }
  };
}

export function startThread(agent: string, threadId: string) {
  return { type: START_THREAD_ACTION, agent, threadId };
}

export function messageAgent(threadId: string, context: Record<string, unknown>, content: string) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const messageId = uuid();
    dispatch({ type: MESSAGE_AGENT_ACTION, threadId, messageId, content, context });

    const { agent } = getState();
    const thread = agent.threads[threadId];
    if (thread) {
      socket.send({ threadId, messageId, agent: thread.agent, content, context });
    }
  };
}
