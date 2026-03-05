import { UserContent } from '@core-services/app-common';
import { Dispatch } from 'redux';
import { io, Socket } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/actions';
import { AppDispatch, RootState } from '../index';
import { AgentConfiguration } from './model';
import axios from 'axios';

export const CONNECT_AGENT_ACTION = 'agent/CONNECT_AGENT';
export const CONNECT_AGENT_SUCCESS_ACTION = 'agent/CONNECT_AGENT_SUCCESS';
export const DISCONNECT_AGENT_ACTION = 'agent/DISCONNECT_AGENT';
export const DISCONNECT_AGENT_SUCCESS_ACTION = 'agent/DISCONNECT_AGENT_SUCCESS';

export const START_THREAD_ACTION = 'agent/START_THREAD';
export const MESSAGE_AGENT_ACTION = 'agent/MESSAGE_AGENT';
export const AGENT_RESPONSE_ACTION = 'agent/AGENT_RESPONSE';

export const GET_AGENTS_ACTION = 'agent/GET_AGENTS';
export const GET_AGENTS_SUCCESS_ACTION = 'agent/GET_AGENTS_SUCCESS';

export const UPDATE_AGENT_ACTION = 'agent/UPDATE_AGENT';
export const UPDATE_AGENT_SUCCESS_ACTION = 'agent/UPDATE_AGENT_SUCCESS';

export const DELETE_AGENT_ACTION = 'agent/DELETE_AGENT';
export const DELETE_AGENT_SUCCESS_ACTION = 'agent/DELETE_AGENT_SUCCESS';

export const EDIT_AGENT_ACTION = 'agent/EDIT_AGENT';
export const START_EDIT_AGENT_ACTION = 'agent/START_EDIT_AGENT';

export const NEW_PREVIEW_THREAD_ACTION = 'agent/NEW_EDITOR_PREVIEW_THREAD';

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
  content: UserContent;
}

export const TEXT_DELTA = 'text-delta';
interface TextDeltaChunk {
  type: typeof TEXT_DELTA;
  payload: {
    text: string;
  }
}

export const TOOL_CALL = 'tool-call';
interface ToolCallChunk {
  type: typeof TOOL_CALL;
  payload: {
    toolCallId: string;
    toolName: string;
  }
}

export const TOOL_CALL_RESULT = 'tool-result';
interface ToolCallResultChunk {
  type: typeof TOOL_CALL_RESULT;
  payload: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result: unknown;
  }
}


export const TOOL_CALL_ERROR = 'tool-error';
interface ToolCallErrorChunk {
  type: typeof TOOL_CALL_ERROR;
  payload: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    error: unknown;
  }
}

export const REASONING_START = 'reasoning-start';
interface ReasoningStartChunk {
  type: typeof REASONING_START,
  payload: {
    id: string;
  }
}

export const REASONING_DELTA = 'reasoning-delta';
interface ReasoningDeltaChunk {
  type: typeof REASONING_DELTA,
  payload: {
    id: string;
    text: string;
  }
}

export const REASONING_END = 'reasoning-end';
interface ReasoningEndChunk {
  type: typeof REASONING_END,
  payload: {
    id: string;
  }
}

export const ERROR = 'error';
interface ErrorChunk {
  type: typeof ERROR,
  payload: {
    message: string;
    details?: unknown;
  }
}

export const TRIPWIRE = 'tripwire';
interface TripwireChunk {
  type: typeof TRIPWIRE,
  payload: {
    message: string;
    details?: unknown;
  }
}

export interface AgentResponseAction {
  type: typeof AGENT_RESPONSE_ACTION;
  threadId: string;
  messageId: string;
  chunk?: TextDeltaChunk |
    ToolCallChunk | ToolCallResultChunk | ToolCallErrorChunk |
    ReasoningStartChunk | ReasoningDeltaChunk | ReasoningEndChunk |
    ErrorChunk | TripwireChunk;
  done: boolean;
}

export interface GetAgentsAction {
  type: typeof GET_AGENTS_ACTION;
}

export interface GetAgentsSuccessAction {
  type: typeof GET_AGENTS_SUCCESS_ACTION;
  agents: AgentConfiguration[];
}

export interface UpdateAgentAction {
  type: typeof UPDATE_AGENT_ACTION;
  agent: AgentConfiguration;
}

export interface UpdateAgentSuccessAction {
  type: typeof UPDATE_AGENT_SUCCESS_ACTION;
  agent: AgentConfiguration;
}

export interface DeleteAgentAction {
  type: typeof DELETE_AGENT_ACTION;
  id: string;
}

export interface DeleteAgentSuccessAction {
  type: typeof DELETE_AGENT_SUCCESS_ACTION;
  id: string;
}

export interface StartEditAgentAction {
  type: typeof START_EDIT_AGENT_ACTION;
  agent: AgentConfiguration;
}

export interface EditAgentAction {
  type: typeof EDIT_AGENT_ACTION;
  agent: AgentConfiguration;
}

export interface NewPreviewThreadAction {
  type: typeof NEW_PREVIEW_THREAD_ACTION;
  threadId: string;
}

export type AgentActionTypes =
  | ConnectAgentAction
  | ConnectAgentSuccessAction
  | DisconnectAgentAction
  | DisconnectAgentSuccessAction
  | StartThreadAction
  | MessageAgentAction
  | AgentResponseAction
  | GetAgentsAction
  | GetAgentsSuccessAction
  | UpdateAgentAction
  | UpdateAgentSuccessAction
  | DeleteAgentAction
  | DeleteAgentSuccessAction
  | StartEditAgentAction
  | EditAgentAction
  | NewPreviewThreadAction;

// wrapping function for socket.on
let socket: Socket;
export function connectAgent() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch({ type: CONNECT_AGENT_ACTION });

    if (socket?.connected) {
      socket.disconnect();
    }

    const { config } = getState();

    socket = io(config.serviceUrls?.agentServiceApiUrl || 'localhost:3380', {
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = await dispatch(getAccessToken());
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
      const { threadId, messageId, chunk, done } = message;
      dispatch({ type: AGENT_RESPONSE_ACTION, threadId, messageId, chunk, done });
    });
    socket.on('error', (err) => {
      dispatch(ErrorNotification({ message: err }));
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

export function messageAgent(threadId: string, context: Record<string, unknown>, content: UserContent) {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const messageId = uuid();
    dispatch({ type: MESSAGE_AGENT_ACTION, threadId, messageId, content, context });

    const { agent } = getState();
    const thread = agent.threads[threadId];
    if (thread) {
      socket.send({ threadId, messageId, agent: thread.agent, content, context, rawChunks: true });
    }
  };
}

export function getAgents() {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      dispatch({ type: GET_AGENTS_ACTION });

      const { config } = getState();

      const agentsConfigurationUrl = new URL(
        '/configuration/v2/configuration/platform/agent-service/latest',
        config.serviceUrls?.configurationServiceApiUrl
      );

      let token = await dispatch(getAccessToken());
      const { data: tenant } = await axios.get<Record<string, Omit<AgentConfiguration, 'id'>>>(
        agentsConfigurationUrl.href,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      token = await dispatch(getAccessToken());
      const { data: core } = await axios.get<Record<string, Omit<AgentConfiguration, 'id'>>>(
        agentsConfigurationUrl.href,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { core: true },
        }
      );

      return dispatch({
        type: GET_AGENTS_SUCCESS_ACTION,
        agents: [
          ...Object.entries(tenant || {}).map(([key, config]) => ({ ...config, id: key })),
          ...Object.entries(core || {}).map(([key, config]) => ({ ...config, id: key, core: true })),
        ],
      });
    } catch (err) {
      dispatch(ErrorNotification({ message: err }));
    }
  };
}

export function updateAgent(agent: AgentConfiguration) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      dispatch({ type: UPDATE_AGENT_ACTION, agent });

      const { config } = getState();

      const agentsConfigurationUrl = new URL(
        '/configuration/v2/configuration/platform/agent-service',
        config.serviceUrls?.configurationServiceApiUrl
      );

      const token = await dispatch(getAccessToken());
      const { data } = await axios.patch<{ latest: { configuration: Record<string, AgentConfiguration> } }>(
        agentsConfigurationUrl.href,
        { operation: 'UPDATE', update: { [agent.id]: agent } },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return dispatch({
        type: UPDATE_AGENT_SUCCESS_ACTION,
        agent: data.latest.configuration[agent.id],
      });
    } catch (err) {
      dispatch(ErrorNotification({ message: err }));
    }
  };
}

export function deleteAgent(id: string) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      dispatch({ type: DELETE_AGENT_ACTION, id });

      const { config } = getState();

      const agentsConfigurationUrl = new URL(
        '/configuration/v2/configuration/platform/agent-service',
        config.serviceUrls?.configurationServiceApiUrl
      );

      const token = await dispatch(getAccessToken());
      await axios.patch(
        agentsConfigurationUrl.href,
        { operation: 'DELETE', property: id },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return dispatch({
        type: DELETE_AGENT_SUCCESS_ACTION,
        id,
      });
    } catch (err) {
      dispatch(ErrorNotification({ message: err }));
    }
  };
}

export function newPreviewThread(): NewPreviewThreadAction {
  return {
    type: NEW_PREVIEW_THREAD_ACTION,
    threadId: uuid(),
  }
}

export function startEditAgent(id: string) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const { agent } = getState();

    let toEdit = agent.agents[id];
    if (!toEdit) {
      const result = await dispatch(getAgents());
      if (result?.type === GET_AGENTS_SUCCESS_ACTION) {
        toEdit = result.agents.find((agent) => agent.id === id);
      }
    }

    if (toEdit) {
      dispatch({ type: START_EDIT_AGENT_ACTION, agent: toEdit });
      dispatch(newPreviewThread());
    }
  };
}
export function editAgent(agent: AgentConfiguration) {
  return {
    type: EDIT_AGENT_ACTION,
    agent,
  };
}
