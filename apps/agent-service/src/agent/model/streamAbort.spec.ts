import { AgentStreamAbortError, mapAgentStreamError, STREAM_ERROR_CODES, toStreamErrorPayload } from './streamAbort';

describe('mapAgentStreamError', () => {
  it('maps AbortError to GENERATION_DEADLINE', () => {
    const error = new Error('aborted');
    error.name = 'AbortError';

    expect(mapAgentStreamError(error)).toEqual({
      code: STREAM_ERROR_CODES.GENERATION_DEADLINE,
      message: 'aborted',
    });
  });

  it('keeps the code carried by an abort error', () => {
    const error = new AgentStreamAbortError(STREAM_ERROR_CODES.MAX_STEPS, 'stopped');

    expect(mapAgentStreamError(error)).toEqual({
      code: STREAM_ERROR_CODES.MAX_STEPS,
      message: 'stopped',
    });
  });
});

describe('toStreamErrorPayload', () => {
  it('reads the message out of a Mastra error chunk payload', () => {
    expect(toStreamErrorPayload({ error: new Error('model refused') })).toEqual({ message: 'model refused' });
  });

  it('keeps the abort code when the chunk carries an abort error', () => {
    expect(
      toStreamErrorPayload({ error: new AgentStreamAbortError(STREAM_ERROR_CODES.MAX_STEPS, 'too many') }),
    ).toEqual({ code: STREAM_ERROR_CODES.MAX_STEPS, message: 'too many' });
  });

  it('falls back to a readable message when there is nothing to read', () => {
    expect(toStreamErrorPayload({ error: {} }).message).toContain('already saved is in the editor');
  });
});
