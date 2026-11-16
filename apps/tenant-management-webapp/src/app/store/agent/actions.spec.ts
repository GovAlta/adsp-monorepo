import axios from 'axios';
import {
  ACCESS_GUIDE_CAPTION,
  addLocalAnswer,
  AGENT_CONVERSATION_STATUS_ACTION,
  answerFromAccessGuide,
  CLEAR_THREAD_ACTION,
  connectAgent,
  discardThread,
  getAccessGuide,
  getAccessScope,
  LOCAL_ANSWER_ACTION,
  MESSAGE_AGENT_ACTION,
  messageAgent,
  resetThread,
} from './actions';

jest.mock('axios');
jest.mock('@store/tenant/actions', () => ({
  getAccessToken: () => async () => 'user-token',
}));

const mockSocket = {
  connected: false,
  handlers: {} as Record<string, (...args: unknown[]) => void>,
  on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    mockSocket.handlers[event] = handler;
  }),
  send: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};
jest.mock('socket.io-client', () => ({ io: jest.fn(() => mockSocket) }));

const mockedGet = axios.get as jest.Mock;
const mockedDelete = axios.delete as jest.Mock;

function createDispatch(state: unknown) {
  const getState = () => state;
  const dispatch = jest.fn((action) => (typeof action === 'function' ? action(dispatch, getState) : action));
  return { dispatch, getState };
}

describe('getAccessScope', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("requests the scope from agent-service with the user's token", async () => {
    const scope = { status: 'available', message: 'You can inspect the realm-1 realm in Development (read-only).' };
    mockedGet.mockResolvedValueOnce({ data: scope });
    const { dispatch, getState } = createDispatch({
      config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
    });

    const result = await getAccessScope()(dispatch as never, getState as never);

    expect(mockedGet).toHaveBeenCalledWith('https://agent-service.test/agent/v1/access/scope', {
      headers: { Authorization: 'Bearer user-token' },
    });
    expect(result).toEqual(scope);
  });

  it('falls back to the local agent-service URL', async () => {
    mockedGet.mockResolvedValueOnce({ data: {} });
    const { dispatch, getState } = createDispatch({ config: {} });

    await getAccessScope()(dispatch as never, getState as never);

    expect(mockedGet.mock.calls[0][0]).toBe('http://localhost:3380/agent/v1/access/scope');
  });

  it('propagates request failures to the caller', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch({ config: {} });

    await expect(getAccessScope()(dispatch as never, getState as never)).rejects.toThrow('Network Error');
  });
});

const TOKEN_EXPIRY_GUIDE = {
  topic: 'token-expiry',
  title: 'Token expiry',
  markdown:
    '## Token expiry\n\nAccess tokens last 5 minutes by default. Change **Access Token Lifespan** to adjust it.',
};

describe('getAccessGuide', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("requests the guide topic from agent-service with the user's token", async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch({
      config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
    });

    // Act
    await getAccessGuide('token-expiry')(dispatch as never, getState as never);

    // Assert
    expect(mockedGet).toHaveBeenCalledWith('https://agent-service.test/agent/v1/access/guide/token-expiry', {
      headers: { Authorization: 'Bearer user-token' },
    });
  });

  it('returns the guide section agent-service serves', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch({
      config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
    });

    // Act
    const guide = await getAccessGuide('token-expiry')(dispatch as never, getState as never);

    // Assert
    expect(guide).toEqual(TOKEN_EXPIRY_GUIDE);
  });

  it('falls back to the local agent-service URL', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch({ config: {} });

    // Act
    await getAccessGuide('disaster-recovery')(dispatch as never, getState as never);

    // Assert
    expect(mockedGet.mock.calls[0][0]).toBe('http://localhost:3380/agent/v1/access/guide/disaster-recovery');
  });

  it('propagates request failures to the caller', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch({ config: {} });

    // Act
    const guide = getAccessGuide('token-expiry')(dispatch as never, getState as never);

    // Assert
    await expect(guide).rejects.toThrow('Network Error');
  });
});

describe('addLocalAnswer', () => {
  const question = [{ type: 'text' as const, text: 'Why is my token expiring too quickly?' }];

  it('adds the question as a user message of the thread', () => {
    // Act
    const action = addLocalAnswer('thread-1', question, TOKEN_EXPIRY_GUIDE.markdown, ACCESS_GUIDE_CAPTION);

    // Assert
    expect(action.question).toEqual({ id: expect.any(String), threadId: 'thread-1', from: 'user', content: question });
  });

  it('adds the answer as a finished agent reply with its caption', () => {
    // Act
    const action = addLocalAnswer('thread-1', question, TOKEN_EXPIRY_GUIDE.markdown, ACCESS_GUIDE_CAPTION);

    // Assert
    expect(action.answer).toEqual({
      id: expect.any(String),
      threadId: 'thread-1',
      from: 'agent',
      content: TOKEN_EXPIRY_GUIDE.markdown,
      caption: 'From the Access Service guide (no AI used)',
      streaming: false,
      toolCalls: [],
    });
  });

  it('gives the question and the answer their own IDs', () => {
    // Act
    const action = addLocalAnswer('thread-1', question, TOKEN_EXPIRY_GUIDE.markdown, ACCESS_GUIDE_CAPTION);

    // Assert
    expect(action.question.id).not.toBe(action.answer.id);
  });

  it('is a local answer action for the thread', () => {
    // Act
    const action = addLocalAnswer('thread-1', question, TOKEN_EXPIRY_GUIDE.markdown, ACCESS_GUIDE_CAPTION);

    // Assert
    expect(action).toMatchObject({ type: LOCAL_ANSWER_ACTION, threadId: 'thread-1' });
  });
});

describe('answerFromAccessGuide', () => {
  const question = [{ type: 'text' as const, text: 'Why is my token expiring too quickly?' }];
  const context = { agentContext: { context: 'tokens', subtopic: 'token-expiry', agent: 'AccessServiceAgent' } };
  const state = {
    config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
    agent: { threads: { 'thread-1': { id: 'thread-1', agent: 'AccessServiceAgent' } } },
  };

  function messageAgentDispatches(dispatch: jest.Mock) {
    return dispatch.mock.calls.filter(([action]) => action?.type === MESSAGE_AGENT_ACTION);
  }

  beforeEach(async () => {
    mockedGet.mockReset();
    mockSocket.send.mockClear();
    mockSocket.connected = true;
    const { dispatch, getState } = createDispatch(state);
    await connectAgent()(dispatch as never, getState as never);
  });

  it('reads the guide topic the question is about', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(mockedGet.mock.calls[0][0]).toBe('https://agent-service.test/agent/v1/access/guide/token-expiry');
  });

  it('adds the question and the guide section to the chat, captioned as answered without AI', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(dispatch).toHaveBeenCalledWith({
      type: LOCAL_ANSWER_ACTION,
      threadId: 'thread-1',
      question: expect.objectContaining({ threadId: 'thread-1', from: 'user', content: question }),
      answer: expect.objectContaining({
        threadId: 'thread-1',
        from: 'agent',
        content: TOKEN_EXPIRY_GUIDE.markdown,
        caption: ACCESS_GUIDE_CAPTION,
      }),
    });
  });

  it('does not add the question to the agent conversation when the guide answers it', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(messageAgentDispatches(dispatch)).toEqual([]);
  });

  it('does not send anything to the agent when the guide answers the question', async () => {
    // Arrange
    mockedGet.mockResolvedValueOnce({ data: TOKEN_EXPIRY_GUIDE });
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('asks the agent instead when the guide cannot be read', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce(new Error('Request failed with status code 503'));
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: MESSAGE_AGENT_ACTION, threadId: 'thread-1', context, content: question }),
    );
  });

  it('sends the question to the Access Service agent when the guide cannot be read', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce(new Error('Request failed with status code 503'));
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(mockSocket.send).toHaveBeenCalledWith(
      expect.objectContaining({ threadId: 'thread-1', agent: 'AccessServiceAgent', context, content: question }),
    );
  });

  it('adds no local answer when the guide cannot be read', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch(state);

    // Act
    await answerFromAccessGuide('thread-1', 'token-expiry', context, question)(dispatch as never, getState as never);

    // Assert
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: LOCAL_ANSWER_ACTION }));
  });

  it('does not surface the failed guide read to the caller', async () => {
    // Arrange
    mockedGet.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch(state);

    // Act
    const answered = answerFromAccessGuide(
      'thread-1',
      'token-expiry',
      context,
      question,
    )(dispatch as never, getState as never);

    // Assert
    await expect(answered).resolves.toBeUndefined();
  });
});

describe('discardThread', () => {
  const agentState = {
    threads: {
      'thread-1': { id: 'thread-1', agent: 'AccessServiceAgent' },
      'thread-2': { id: 'thread-2', agent: 'AccessServiceAgent' },
    },
  };
  const state = { config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } }, agent: agentState };

  beforeEach(() => {
    mockedDelete.mockReset().mockResolvedValue({ data: { deleted: true } });
    mockSocket.send.mockClear();
  });

  it('clears the thread and deletes it on the server with the user token', async () => {
    const { dispatch, getState } = createDispatch(state);

    await discardThread('thread-1', { deleteOnServer: true })(dispatch as never, getState as never);

    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
    expect(mockedDelete).toHaveBeenCalledWith(
      'https://agent-service.test/agent/v1/agents/AccessServiceAgent/threads/thread-1',
      { headers: { Authorization: 'Bearer user-token' } },
    );
  });

  it('only clears the thread when it should be left to expire on the server', async () => {
    const { dispatch, getState } = createDispatch(state);

    await discardThread('thread-1', { deleteOnServer: false })(dispatch as never, getState as never);

    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('does not call the server for a thread it does not know', async () => {
    const { dispatch, getState } = createDispatch(state);

    await discardThread('unknown', { deleteOnServer: true })(dispatch as never, getState as never);

    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'unknown' });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('still clears the thread when the server cannot delete it', async () => {
    mockedDelete.mockRejectedValueOnce(new Error('Network Error'));
    const { dispatch, getState } = createDispatch(state);

    await expect(
      discardThread('thread-1', { deleteOnServer: true })(dispatch as never, getState as never),
    ).resolves.toBeUndefined();
    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
  });

  it('drops messages for the thread that are still waiting to be sent', async () => {
    const { dispatch, getState } = createDispatch(state);
    mockSocket.connected = false;
    await connectAgent()(dispatch as never, getState as never);
    messageAgent('thread-1', {}, [{ type: 'text', text: 'Old question' }])(dispatch as never, getState as never);
    messageAgent('thread-2', {}, [{ type: 'text', text: 'Other question' }])(dispatch as never, getState as never);

    await discardThread('thread-1', { deleteOnServer: false })(dispatch as never, getState as never);
    mockSocket.connected = true;
    mockSocket.handlers.connect();

    expect(mockSocket.send).toHaveBeenCalledTimes(1);
    expect(mockSocket.send).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'thread-2' }));
  });
});

describe('conversation status from agent-service', () => {
  const state = {
    config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
    agent: { threads: {} },
  };

  it('stores the status with the message limit of a notice', async () => {
    // Arrange
    const { dispatch, getState } = createDispatch(state);
    await connectAgent()(dispatch as never, getState as never);

    // Act
    mockSocket.handlers['conversation-status']({
      agent: 'formGenerationAgent',
      threadId: 'thread-1',
      contextTokens: 13600,
      contextWindowTokens: 256000,
      state: 'notice',
      reason: 'older-messages-dropped',
      messageLimit: 20,
    });

    // Assert
    expect(dispatch).toHaveBeenCalledWith({
      type: AGENT_CONVERSATION_STATUS_ACTION,
      threadId: 'thread-1',
      status: {
        contextTokens: 13600,
        contextWindowTokens: 256000,
        state: 'notice',
        reason: 'older-messages-dropped',
        messageLimit: 20,
      },
    });
  });
});

describe('resetThread', () => {
  const question = {
    id: 'question-1',
    threadId: 'thread-1',
    from: 'user',
    content: [{ type: 'text', text: 'Which clients?' }],
  };
  const reply = {
    id: 'reply-1',
    threadId: 'thread-1',
    from: 'agent',
    content: 'Three clients.',
    streaming: false,
    toolCalls: [],
  };

  function stateWith(lastReply: Record<string, unknown> | undefined) {
    const messages = lastReply ? { 'question-1': question, 'reply-1': lastReply } : { 'question-1': question };
    return {
      config: { serviceUrls: { agentServiceApiUrl: 'https://agent-service.test' } },
      agent: {
        threads: { 'thread-1': { id: 'thread-1', agent: 'AccessServiceAgent' } },
        threadMessages: { 'thread-1': Object.keys(messages) },
        messages,
      },
    };
  }

  beforeEach(() => {
    mockedDelete.mockReset().mockResolvedValue({ data: { deleted: true } });
  });

  it('deletes the thread on the server once the reply has finished', async () => {
    // Arrange
    const { dispatch, getState } = createDispatch(stateWith(reply));

    // Act
    await resetThread('thread-1')(dispatch as never, getState as never);

    // Assert
    expect(mockedDelete).toHaveBeenCalledWith(
      'https://agent-service.test/agent/v1/agents/AccessServiceAgent/threads/thread-1',
      expect.anything(),
    );
  });

  it('leaves the thread to expire on the server while a reply is still in progress', async () => {
    // Arrange
    const { dispatch, getState } = createDispatch(stateWith({ ...reply, streaming: true }));

    // Act
    await resetThread('thread-1')(dispatch as never, getState as never);

    // Assert
    expect(dispatch).toHaveBeenCalledWith({ type: CLEAR_THREAD_ACTION, threadId: 'thread-1' });
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('leaves the thread to expire on the server when a reply was cut off by a reconnect', async () => {
    // Arrange
    const { dispatch, getState } = createDispatch(stateWith({ ...reply, interrupted: true }));

    // Act
    await resetThread('thread-1')(dispatch as never, getState as never);

    // Assert
    expect(mockedDelete).not.toHaveBeenCalled();
  });

  it('leaves the thread to expire on the server while the question has no reply yet', async () => {
    // Arrange
    const { dispatch, getState } = createDispatch(stateWith(undefined));

    // Act
    await resetThread('thread-1')(dispatch as never, getState as never);

    // Assert
    expect(mockedDelete).not.toHaveBeenCalled();
  });
});
