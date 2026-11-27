import { APICallError, TypeValidationError } from '@ai-sdk/provider';
import {
  AgentStreamAbortError,
  describeModelFailure,
  mapAgentStreamError,
  MODEL_REJECTED_MESSAGE,
  MODEL_UNAVAILABLE_MESSAGE,
  rateLimitedMessage,
  STREAM_ERROR_CODES,
  toStreamErrorPayload,
  toToolErrorPayload,
} from './streamAbort';

const TRY_AGAIN_IN_A_MINUTE = 'The AI service is busy right now. Please try again in a minute.';

/** The AI SDK's error for a model endpoint that answered with an error status, or that could not be reached. */
function apiCallError({
  statusCode,
  message,
  responseHeaders,
}: {
  statusCode?: number;
  message: string;
  responseHeaders?: Record<string, string>;
}): APICallError {
  return new APICallError({
    message,
    url: 'https://maas.test/v1/chat/completions',
    requestBodyValues: {},
    statusCode,
    responseHeaders,
  });
}

/** The AI SDK's APICallError for a provider that answered 429, with a message that does not mention the status. */
function providerRateLimitError(): Error {
  return Object.assign(new Error('Provider request failed.'), { name: 'AI_APICallError', statusCode: 429 });
}

/** Wraps an error in the given number of plain cause links. */
function wrapInCauses(error: unknown, levels: number): unknown {
  return Array.from({ length: levels }).reduce((inner) => ({ message: 'Agent step failed.', cause: inner }), error);
}

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

  it('gives a Mastra error chunk carrying a provider 429 the RATE_LIMITED code', () => {
    // Arrange
    const payload = { error: providerRateLimitError() };

    // Act
    const result = toStreamErrorPayload(payload);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message: TRY_AGAIN_IN_A_MINUTE });
  });
});

describe('mapAgentStreamError for rate limits', () => {
  it.each(['Syntax error at line 429', 'A moderate limit applies', 'Use a separate limit per tenant'])(
    'does not mistake "%s" for a rate limit',
    (message) => {
      // Act
      const result = mapAgentStreamError(new Error(message));

      // Assert
      expect(result).toBeNull();
    },
  );

  it('stops at a cause that refers back to itself', () => {
    // Arrange
    const error: { message: string; cause?: unknown } = { message: 'Agent step failed.' };
    error.cause = error;

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
  });

  it('maps a provider error with status code 429 to RATE_LIMITED', () => {
    // Arrange
    const error = providerRateLimitError();

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message: TRY_AGAIN_IN_A_MINUTE });
  });

  it.each([
    [
      'the lastError of a retry error',
      Object.assign(new Error('Failed after 3 attempts.'), {
        name: 'AI_RetryError',
        lastError: providerRateLimitError(),
      }),
    ],
    [
      'the errors of a retry error',
      Object.assign(new Error('Failed after 3 attempts.'), {
        name: 'AI_RetryError',
        errors: [new Error('socket hang up'), providerRateLimitError()],
      }),
    ],
    ['the cause of another error', Object.assign(new Error('Agent step failed.'), { cause: providerRateLimitError() })],
  ])('maps a 429 wrapped in %s to RATE_LIMITED', (_wrapping, error) => {
    // Arrange
    const wrapped = error;

    // Act
    const result = mapAgentStreamError(wrapped);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message: TRY_AGAIN_IN_A_MINUTE });
  });

  it('maps a 429 wrapped five levels deep to RATE_LIMITED', () => {
    // Arrange
    const error = wrapInCauses(providerRateLimitError(), 5);

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.code).toBe(STREAM_ERROR_CODES.RATE_LIMITED);
  });

  it('does not look for a 429 more than five levels deep', () => {
    // Arrange
    const error = wrapInCauses(providerRateLimitError(), 6);

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
  });

  it('stops looking in a retry error that lists itself as its last error', () => {
    // Arrange
    const error: { message: string; lastError?: unknown } = { message: 'Failed after 3 attempts.' };
    error.lastError = error;

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
  });

  it('skips empty entries in the errors of a retry error', () => {
    // Arrange
    const error = Object.assign(new Error('Failed after 3 attempts.'), {
      name: 'AI_RetryError',
      errors: [null, providerRateLimitError()],
    });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.code).toBe(STREAM_ERROR_CODES.RATE_LIMITED);
  });

  it.each([undefined, null])('returns null when %p was thrown', (thrown) => {
    // Arrange
    const error = thrown;

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
  });

  it.each([
    'Rate limit reached for gpt-4.1 in organization org-demo on tokens per min (TPM).',
    'rate_limit_exceeded',
    'Request failed with status code 429',
    'Too Many Requests',
    'too many requests',
  ])('maps an error with the message %p to RATE_LIMITED', (message) => {
    // Arrange
    const error = new Error(message);

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message: TRY_AGAIN_IN_A_MINUTE });
  });

  it('maps a rate-limit message thrown as a string to RATE_LIMITED', () => {
    // Arrange
    const error = '429 Too Many Requests';

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.code).toBe(STREAM_ERROR_CODES.RATE_LIMITED);
  });

  it('does not treat 429 inside a larger number as a rate limit', () => {
    // Arrange
    const error = new Error('Prompt used 14290 tokens.');

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
  });

  it('does not treat a provider error with another status code as a rate limit', () => {
    // Arrange
    const error = apiCallError({ statusCode: 500, message: 'Internal server error.' });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.code).toBe(STREAM_ERROR_CODES.MODEL_ERROR);
  });

  it('maps an abort error that reports a rate limit to RATE_LIMITED rather than GENERATION_DEADLINE', () => {
    // Arrange
    const error = Object.assign(new Error('Request aborted: Too Many Requests'), { name: 'AbortError' });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message: TRY_AGAIN_IN_A_MINUTE });
  });

  it('keeps the message of an error that already carries the RATE_LIMITED code', () => {
    // Arrange
    const message = 'The AI service is busy right now. Please try again in about 40 seconds.';
    const error = new AgentStreamAbortError(STREAM_ERROR_CODES.RATE_LIMITED, message);

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message });
  });

  it('reads the RATE_LIMITED code from the cause of an error', () => {
    // Arrange
    const message = 'The AI service is busy right now. Please try again in about 40 seconds.';
    const error = Object.assign(new Error('Agent stopped.'), {
      cause: { code: STREAM_ERROR_CODES.RATE_LIMITED, message },
    });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.RATE_LIMITED, message });
  });
});

describe('mapAgentStreamError for model endpoint errors', () => {
  it("tells the user the key's window from a MaaS token limit, without the customer it names", () => {
    // Arrange
    const error = apiCallError({
      statusCode: 429,
      message:
        'Rate limit exceeded: rate limit violated for customer Jane Doe: [token limit exceeded (12681/10000, resets every 5m)]',
    });

    // Act
    const result = mapAgentStreamError({ message: 'Agent step failed.', cause: error });

    // Assert
    expect(result).toEqual({
      code: STREAM_ERROR_CODES.RATE_LIMITED,
      message: 'The AI service is busy right now. Please try again within 5 minutes.',
    });
  });

  it('says a one-minute window as "a minute"', () => {
    // Arrange
    const error = apiCallError({ statusCode: 429, message: 'token limit exceeded (21000/20000, resets every 1m)' });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.message).toBe('The AI service is busy right now. Please try again within a minute.');
  });

  it('says how long to wait from a retry time sent in milliseconds', () => {
    // Arrange
    const error = apiCallError({
      statusCode: 429,
      message: 'token limit exceeded (21000/20000, resets every 1m)',
      responseHeaders: { 'x-bifrost-retry-after-ms': '40200' },
    });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.message).toBe('The AI service is busy right now. Please try again in about 41 seconds.');
  });

  it('reads a retry-after header given in seconds', () => {
    // Arrange
    const error = apiCallError({
      statusCode: 429,
      message: 'Too Many Requests',
      responseHeaders: { 'retry-after': '7' },
    });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.message).toBe('The AI service is busy right now. Please try again in about 7 seconds.');
  });

  it("replaces the endpoint's own message, which can name the key, with a plain one", () => {
    // Arrange
    const error = apiCallError({ statusCode: 500, message: "Upstream error for virtual key 'Jane Doe dev key'" });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.MODEL_ERROR, message: MODEL_UNAVAILABLE_MESSAGE });
  });

  it('says the service is not responding when the endpoint cannot be reached', () => {
    // Arrange
    const error = apiCallError({ message: 'Cannot connect to API: other side closed' });

    // Act
    const result = toStreamErrorPayload({ error: wrapInCauses(error, 2) });

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.MODEL_ERROR, message: MODEL_UNAVAILABLE_MESSAGE });
  });

  it('says the message could not be processed when the endpoint rejects the request', () => {
    // Arrange
    const error = apiCallError({ statusCode: 400, message: 'context length exceeded' });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.MODEL_ERROR, message: MODEL_REJECTED_MESSAGE });
  });

  it('says the service is not responding, rather than asking for a rephrase, when the key is refused', () => {
    // Arrange
    const error = apiCallError({ statusCode: 401, message: 'virtual key is required' });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.message).toBe(MODEL_UNAVAILABLE_MESSAGE);
  });

  it('replaces an error the endpoint sends inside a stream, which arrives as its parsed body', () => {
    // Arrange
    const payload = { error: { message: 'Upstream failure for customer Jane Doe', type: 'server_error', code: null } };

    // Act
    const result = toStreamErrorPayload(payload);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.MODEL_ERROR, message: MODEL_UNAVAILABLE_MESSAGE });
  });

  it('replaces a reply chunk the SDK could not read, whose message quotes the chunk', () => {
    // Arrange
    const error = new TypeValidationError({ value: { choices: 'customer Jane Doe' }, cause: new Error('Invalid') });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({ code: STREAM_ERROR_CODES.MODEL_ERROR, message: MODEL_UNAVAILABLE_MESSAGE });
  });

  it('does not read an inherited property name as a stream error code', () => {
    // Act
    const result = mapAgentStreamError(Object.assign(new Error('Not a stream code.'), { code: 'toString' }));

    // Assert
    expect(result).toBeNull();
  });
});

describe('describeModelFailure', () => {
  it('leaves an error from another service alone, even one with status 429', () => {
    // Arrange
    const error = new Error('Failed to update form schema: Request failed with status code 429');

    // Act
    const result = describeModelFailure(error);

    // Assert
    expect(result).toBeUndefined();
  });
});

describe('toToolErrorPayload', () => {
  it('gives a sub-agent or tool that failed on the model endpoint the plain message', () => {
    // Arrange
    const error = apiCallError({ statusCode: 429, message: 'token limit exceeded (12681/10000, resets every 5m)' });

    // Act
    const payload = toToolErrorPayload({ toolCallId: 'call-1', toolName: 'agent-pdfFormAnalysisAgent', error });

    // Assert
    expect(payload).toEqual({
      toolCallId: 'call-1',
      toolName: 'agent-pdfFormAnalysisAgent',
      error: 'The AI service is busy right now. Please try again within 5 minutes.',
    });
  });

  it("keeps a tool's own error", () => {
    // Arrange
    const payload = { toolCallId: 'call-1', toolName: 'formSchemaPatch', error: new Error('Unknown scope.') };

    // Act
    const result = toToolErrorPayload(payload);

    // Assert
    expect(result).toBe(payload);
  });
});

describe('mapAgentStreamError for aborts and step limits', () => {
  it('maps a TimeoutError to GENERATION_DEADLINE', () => {
    // Arrange
    const error = Object.assign(new Error('The operation timed out.'), { name: 'TimeoutError' });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({
      code: STREAM_ERROR_CODES.GENERATION_DEADLINE,
      message: 'The operation timed out.',
    });
  });

  it('gives an abort error without a message the default deadline message', () => {
    // Arrange
    const error = { name: 'AbortError' };

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toEqual({
      code: STREAM_ERROR_CODES.GENERATION_DEADLINE,
      message: 'Form generation exceeded the time limit. Anything already saved is in the editor.',
    });
  });

  it('keeps MAX_STEPS for a step-limit abort whose message mentions a rate limit', () => {
    // Arrange
    const error = new AgentStreamAbortError(
      STREAM_ERROR_CODES.MAX_STEPS,
      'Stopped after 20 steps to stay under the rate limit.',
    );

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result?.code).toBe(STREAM_ERROR_CODES.MAX_STEPS);
  });

  it('returns null for an error that is neither an abort nor a rate limit', () => {
    // Arrange
    const error = new Error('model refused');

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
  });
});

describe('rateLimitedMessage', () => {
  it('asks the user to try again in a minute when the wait is unknown', () => {
    // Arrange
    const retryAfterMs = undefined;

    // Act
    const message = rateLimitedMessage(retryAfterMs);

    // Assert
    expect(message).toBe(TRY_AGAIN_IN_A_MINUTE);
  });

  it.each([
    [1000, 'The AI service is busy right now. Please try again in about 1 second.'],
    [1, 'The AI service is busy right now. Please try again in about 1 second.'],
    [0, 'The AI service is busy right now. Please try again in about 1 second.'],
    [-500, 'The AI service is busy right now. Please try again in about 1 second.'],
    [1001, 'The AI service is busy right now. Please try again in about 2 seconds.'],
    [40_000, 'The AI service is busy right now. Please try again in about 40 seconds.'],
    [180_000, 'The AI service is busy right now. Please try again in about 180 seconds.'],
  ])('words a wait of %d ms as %p', (retryAfterMs, expected) => {
    // Arrange
    const wait = retryAfterMs;

    // Act
    const message = rateLimitedMessage(wait);

    // Assert
    expect(message).toBe(expected);
  });
});
