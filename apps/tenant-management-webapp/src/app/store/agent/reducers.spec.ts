import {
  AGENT_CONVERSATION_STATUS_ACTION,
  AGENT_RESPONSE_ACTION,
  AgentActionTypes,
  CLEAR_THREAD_ACTION,
  CONNECT_AGENT_SUCCESS_ACTION,
  MESSAGE_AGENT_ACTION,
  START_THREAD_ACTION,
} from './actions';
import reducer from './reducers';
import { AgentMessage } from '@core-services/app-common';
import { AgentState } from './model';

const THREAD_ID = 'thread-1';
const MESSAGE_ID = 'message-1';

function responseAction(chunk: unknown, done = false): AgentActionTypes {
  return {
    type: AGENT_RESPONSE_ACTION,
    threadId: THREAD_ID,
    messageId: MESSAGE_ID,
    chunk,
    done,
  } as AgentActionTypes;
}

function reduceAll(actions: AgentActionTypes[]): AgentState {
  const started = [
    { type: START_THREAD_ACTION, threadId: THREAD_ID, agent: 'formGenerationAgent' },
    { type: MESSAGE_AGENT_ACTION, threadId: THREAD_ID, messageId: 'user-1', context: {}, content: 'build a form' },
  ].reduce<AgentState>((state, action) => reducer(state, action as AgentActionTypes), undefined);

  return actions.reduce<AgentState>((state, action) => reducer(state, action), started);
}

describe('agent reducer response chunks', () => {
  it('keeps the tool call args when the result chunk omits them', () => {
    const state = reduceAll([
      responseAction({ type: 'tool-call', payload: { toolCallId: 'call-1', toolName: 'increment-form-schema' } }),
      responseAction({
        type: 'tool-result',
        payload: {
          toolCallId: 'call-1',
          toolName: 'increment-form-schema',
          args: { incrementIndex: 1 },
          result: { success: true },
        },
      }),
      responseAction({
        type: 'tool-result',
        payload: { toolCallId: 'call-1', toolName: 'increment-form-schema', result: { success: true } },
      }),
    ]);

    const message = state.messages[MESSAGE_ID] as AgentMessage;
    expect(message.toolCalls[0].args).toEqual({ incrementIndex: 1 });
    expect(message.toolCalls[0].result).toEqual({ success: true });
  });

  it('falls back to a readable message when the error chunk has none', () => {
    const state = reduceAll([responseAction({ type: 'error', payload: {} }, true)]);

    const message = state.messages[MESSAGE_ID] as AgentMessage;
    expect(message.errors[0].message).toContain('already saved is in the editor');
  });

  it('keeps the mapped stream error message and code', () => {
    const state = reduceAll([
      responseAction({ type: 'error', payload: { code: 'INCREMENT_STOPPED', message: 'Generation stopped.' } }, true),
    ]);

    const message = state.messages[MESSAGE_ID] as AgentMessage;
    expect(message.errors[0].message).toBe('Generation stopped.');
    expect(message.errors[0].details).toEqual({ code: 'INCREMENT_STOPPED' });
  });
});

describe('agent reducer reconnect', () => {
  const reconnect = { type: CONNECT_AGENT_SUCCESS_ACTION } as AgentActionTypes;

  it('completes a reply cut off by a reconnect and marks it interrupted', () => {
    const state = reduceAll([responseAction({ type: 'text-delta', payload: { text: 'Partial' } }), reconnect]);

    expect(state.messages[MESSAGE_ID]).toMatchObject({ streaming: false, interrupted: true, content: 'Partial' });
    expect(state.connected).toBe(true);
  });

  it('does not mark a reply that finished before the reconnect', () => {
    const state = reduceAll([
      responseAction({ type: 'text-delta', payload: { text: 'Complete' } }),
      responseAction(undefined, true),
      reconnect,
    ]);

    expect(state.messages[MESSAGE_ID]).toMatchObject({ streaming: false, content: 'Complete' });
    expect(state.messages[MESSAGE_ID]).not.toHaveProperty('interrupted');
  });
});

describe('agent reducer usage and conversation status', () => {
  const usage = {
    contextTokens: 36000,
    contextWindowTokens: 256000,
    totalTokens: 111000,
    outputTokens: 1400,
    modelCalls: 3,
  };
  const longStatus = {
    contextTokens: 36000,
    contextWindowTokens: 256000,
    state: 'notice',
    reason: 'summarised',
  } as const;

  function statusAction(threadId = THREAD_ID): AgentActionTypes {
    return { type: AGENT_CONVERSATION_STATUS_ACTION, threadId, status: longStatus };
  }

  it('keeps the usage of a finished reply on the reply', () => {
    // Arrange
    const done = { ...responseAction(undefined, true), usage } as AgentActionTypes;

    // Act
    const state = reduceAll([responseAction({ type: 'text-delta', payload: { text: 'Three clients.' } }), done]);

    // Assert
    expect((state.messages[MESSAGE_ID] as AgentMessage).usage).toEqual(usage);
  });

  it('keeps the conversation status of a thread', () => {
    // Act
    const state = reduceAll([statusAction()]);

    // Assert
    expect(state.conversationStatus[THREAD_ID]).toEqual(longStatus);
  });

  it('ignores the conversation status of a thread it no longer tracks', () => {
    // Act
    const state = reduceAll([statusAction('discarded-thread')]);

    // Assert
    expect(state.conversationStatus['discarded-thread']).toBeUndefined();
  });

  it('drops the conversation status with its thread', () => {
    // Act
    const state = reduceAll([statusAction(), { type: CLEAR_THREAD_ACTION, threadId: THREAD_ID } as AgentActionTypes]);

    // Assert
    expect(state.conversationStatus[THREAD_ID]).toBeUndefined();
  });
});
