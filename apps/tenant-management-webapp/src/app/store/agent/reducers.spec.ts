import {
  AGENT_CONVERSATION_STATUS_ACTION,
  AGENT_RESPONSE_ACTION,
  AgentActionTypes,
  CLEAR_THREAD_ACTION,
  CONNECT_AGENT_SUCCESS_ACTION,
  LOCAL_ANSWER_ACTION,
  MESSAGE_AGENT_ACTION,
  START_THREAD_ACTION,
} from './actions';
import reducer from './reducers';
import { AgentMessage, UserMessage } from '@core-services/app-common';
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

describe('agent reducer local answers', () => {
  const question: UserMessage = {
    id: 'guide-question-1',
    threadId: THREAD_ID,
    from: 'user',
    content: [{ type: 'text', text: 'Why is my token expiring too quickly?' }],
  };
  const answer: AgentMessage = {
    id: 'guide-answer-1',
    threadId: THREAD_ID,
    from: 'agent',
    content: '## Token expiry\n\nAccess tokens last 5 minutes by default.',
    caption: 'From the Access Service guide (no AI used)',
    streaming: false,
    toolCalls: [],
  };

  function localAnswer(threadId = THREAD_ID): AgentActionTypes {
    return {
      type: LOCAL_ANSWER_ACTION,
      threadId,
      question: { ...question, threadId },
      answer: { ...answer, threadId },
    };
  }

  it('adds the question and then the answer after the earlier messages of the thread', () => {
    // Act
    const state = reduceAll([localAnswer()]);

    // Assert
    expect(state.threadMessages[THREAD_ID]).toEqual(['user-1', 'guide-question-1', 'guide-answer-1']);
  });

  it('keeps the question as it was asked', () => {
    // Act
    const state = reduceAll([localAnswer()]);

    // Assert
    expect(state.messages['guide-question-1']).toEqual(question);
  });

  it('keeps the answer with its caption', () => {
    // Act
    const state = reduceAll([localAnswer()]);

    // Assert
    expect(state.messages['guide-answer-1']).toEqual(answer);
  });

  it('starts the message list of a thread that has none yet', () => {
    // Arrange
    const started = reducer(undefined, {
      type: START_THREAD_ACTION,
      threadId: 'thread-2',
      agent: 'AccessServiceAgent',
    } as AgentActionTypes);

    // Act
    const state = reducer(started, localAnswer('thread-2'));

    // Assert
    expect(state.threadMessages['thread-2']).toEqual(['guide-question-1', 'guide-answer-1']);
  });

  it('ignores an answer that arrives after the user reset the chat', () => {
    // Arrange
    const reset = reduceAll([{ type: CLEAR_THREAD_ACTION, threadId: THREAD_ID } as AgentActionTypes]);

    // Act
    const state = reducer(reset, localAnswer());

    // Assert
    expect(state).toBe(reset);
  });
});

describe('agent reducer Access Service guide fallback', () => {
  const guide = {
    topic: 'token-expiry',
    title: 'Token expiry',
    markdown: '## Token expiry\n\nAccess tokens last 5 minutes by default.',
  };

  function reduceAccessReply(actions: AgentActionTypes[]): AgentMessage {
    const started = [
      { type: START_THREAD_ACTION, threadId: THREAD_ID, agent: 'AccessServiceAgent' },
      {
        type: MESSAGE_AGENT_ACTION,
        threadId: THREAD_ID,
        messageId: 'user-1',
        context: {},
        content: [{ type: 'text', text: 'Why is my token expiring too quickly?' }],
      },
    ].reduce<AgentState>((state, action) => reducer(state, action as AgentActionTypes), undefined);

    const state = actions.reduce<AgentState>((current, action) => reducer(current, action), started);
    return state.messages[MESSAGE_ID] as AgentMessage;
  }

  const guideResult = responseAction({
    type: 'tool-result',
    payload: { toolCallId: 'call-1', toolName: 'getAccessGuide', args: { topic: 'token-expiry' }, result: guide },
  });

  it('shows the markdown of the guide the agent read when its reply has no text', () => {
    // Act
    const message = reduceAccessReply([guideResult, responseAction(undefined, true)]);

    // Assert
    expect(message.content).toBe(guide.markdown);
  });

  it('shows the markdown of a guide section given as the reply output when the reply has no text', () => {
    // Arrange
    const done = { ...responseAction(undefined, true), output: guide } as AgentActionTypes;

    // Act
    const message = reduceAccessReply([done]);

    // Assert
    expect(message.content).toBe(guide.markdown);
  });

  it('keeps the agent’s own text over the guide it read', () => {
    // Act
    const message = reduceAccessReply([
      guideResult,
      responseAction({ type: 'text-delta', payload: { text: 'Tokens last 5 minutes; raise the lifespan.' } }),
      responseAction(undefined, true),
    ]);

    // Assert
    expect(message.content).toBe('Tokens last 5 minutes; raise the lifespan.');
  });
});
