import {
  AgentStreamAbortError,
  mapAgentStreamError,
  rateLimitedMessage,
  STREAM_ERROR_CODES,
  toStreamErrorPayload,
} from './streamAbort';

const TRY_AGAIN_IN_A_MINUTE = 'The AI service is busy right now. Please try again in a minute.';

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

  it('does not map a provider error with another status code', () => {
    // Arrange
    const error = Object.assign(new Error('Internal server error.'), { name: 'AI_APICallError', statusCode: 500 });

    // Act
    const result = mapAgentStreamError(error);

    // Assert
    expect(result).toBeNull();
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
