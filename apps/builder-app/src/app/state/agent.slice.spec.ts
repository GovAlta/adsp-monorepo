import { AgentMessage, Message } from '@core-services/app-common';
import {
  AGENT_FEATURE_KEY,
  agentActions,
  agentConnectionStatusSelector,
  agentInitialState,
  agentMessagesByThreadSelector,
  agentReducer,
  agentSocketConnectedSelector,
  agentWorkspaceRefreshingSelector,
  agentWorkspaceStatusSelector,
  type AgentState,
} from './agent.slice';

describe('builder agent slice', () => {
  it('returns the initial state', () => {
    expect(agentReducer(undefined, { type: 'unknown' })).toEqual(agentInitialState);
  });

  it('stores and replaces initialized messages by id', () => {
    const first: Message = {
      id: 'message-1',
      threadId: 'thread-1',
      from: 'user',
      content: [{ type: 'text', text: 'first' }],
    };
    const replacement: Message = {
      id: 'message-1',
      threadId: 'thread-1',
      from: 'user',
      content: [{ type: 'text', text: 'updated' }],
    };

    const state = agentReducer(
      agentReducer(agentInitialState, agentActions.initializeMessage(first)),
      agentActions.initializeMessage(replacement),
    );

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(replacement);
  });

  it('builds streamed assistant messages with reasoning and tool updates', () => {
    let state = agentReducer(
      agentInitialState,
      agentActions.applyStreamEvent({
        threadId: 'thread-1',
        event: {
          messageId: 'agent-1',
          chunk: { type: 'text-delta', payload: { text: 'Hello ' } },
        },
      }),
    );

    state = agentReducer(
      state,
      agentActions.applyStreamEvent({
        threadId: 'thread-1',
        event: {
          messageId: 'agent-1',
          chunk: { type: 'reasoning-delta', payload: { text: 'Inspecting workspace' } },
        },
      }),
    );

    state = agentReducer(
      state,
      agentActions.applyStreamEvent({
        threadId: 'thread-1',
        event: {
          messageId: 'agent-1',
          chunk: {
            type: 'tool-call',
            payload: { toolCallId: 'tool-1', toolName: 'workspace-read', args: { path: '/' } },
          },
        },
      }),
    );

    state = agentReducer(
      state,
      agentActions.applyStreamEvent({
        threadId: 'thread-1',
        event: {
          messageId: 'agent-1',
          chunk: {
            type: 'tool-result',
            payload: { toolCallId: 'tool-1', toolName: 'workspace-read', result: { ok: true } },
          },
          done: true,
        },
      }),
    );

    const message = state.messages[0] as AgentMessage;

    expect(message.from).toBe('agent');
    expect(message.content).toBe('Hello ');
    expect(message.reasoning?.content).toBe('Inspecting workspace');
    expect(message.streaming).toBe(false);
    expect(message.toolCalls).toEqual([
      {
        toolCallId: 'tool-1',
        toolName: 'workspace-read',
        args: { path: '/' },
        result: { ok: true },
        error: undefined,
      },
    ]);
  });

  it('captures agent errors from stream chunks', () => {
    const state = agentReducer(
      agentInitialState,
      agentActions.applyStreamEvent({
        threadId: 'thread-1',
        event: {
          messageId: 'agent-2',
          chunk: { type: 'error', payload: { message: 'failure' } },
        },
      }),
    );

    const message = state.messages[0] as AgentMessage;
    expect(message.errors).toEqual([{ type: 'error', message: '{\n  "message": "failure"\n}' }]);
  });

  it('updates and resets session status fields', () => {
    let state = agentReducer(agentInitialState, agentActions.setConnectionStatus('Connected'));
    state = agentReducer(state, agentActions.setWorkspaceStatus('Workspace synchronized'));
    state = agentReducer(state, agentActions.setSocketConnected(true));
    state = agentReducer(state, agentActions.setWorkspaceRefreshing(true));

    expect(state.connectionStatus).toBe('Connected');
    expect(state.workspaceStatus).toBe('Workspace synchronized');
    expect(state.isSocketConnected).toBe(true);
    expect(state.isWorkspaceRefreshing).toBe(true);

    state = agentReducer(state, agentActions.resetSessionState());

    expect(state.connectionStatus).toBe(agentInitialState.connectionStatus);
    expect(state.workspaceStatus).toBe(agentInitialState.workspaceStatus);
    expect(state.isSocketConnected).toBe(false);
    expect(state.isWorkspaceRefreshing).toBe(false);
  });

  it('selects thread messages and session status', () => {
    const populatedAgentState: AgentState = {
      ...agentInitialState,
      messages: [
        {
          id: 'user-1',
          threadId: 'thread-1',
          from: 'user',
          content: [{ type: 'text', text: 'hello' }],
        },
        {
          id: 'agent-1',
          threadId: 'thread-2',
          from: 'agent',
          content: 'world',
          toolCalls: [],
          streaming: false,
        },
      ],
      connectionStatus: 'Connected to builder agent',
      workspaceStatus: 'Workspace synchronized (2 files)',
      isSocketConnected: true,
      isWorkspaceRefreshing: false,
    };

    const state = {
      [AGENT_FEATURE_KEY]: populatedAgentState,
    } as {
      agent: AgentState;
    };

    expect(agentMessagesByThreadSelector(state, 'thread-1')).toHaveLength(1);
    expect(agentConnectionStatusSelector(state)).toBe('Connected to builder agent');
    expect(agentWorkspaceStatusSelector(state)).toBe('Workspace synchronized (2 files)');
    expect(agentSocketConnectedSelector(state)).toBe(true);
    expect(agentWorkspaceRefreshingSelector(state)).toBe(false);
  });
});
