import { AGENT_RESPONSE_ACTION, AgentActionTypes, MESSAGE_AGENT_ACTION, START_THREAD_ACTION } from './actions';
import reducer from './reducers';
import { AgentMessage } from './models';

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

function reduceAll(actions: AgentActionTypes[]) {
  const started = [
    { type: START_THREAD_ACTION, threadId: THREAD_ID, agent: 'formGenerationAgent' },
    { type: MESSAGE_AGENT_ACTION, threadId: THREAD_ID, messageId: 'user-1', context: {}, content: 'build a form' },
  ].reduce((state, action) => reducer(state, action as AgentActionTypes), undefined);

  return actions.reduce((state, action) => reducer(state, action), started);
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
