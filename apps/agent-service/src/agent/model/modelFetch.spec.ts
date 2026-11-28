import { createRetryingFetch } from './modelFetch';

function connectionError(code: string): TypeError {
  return Object.assign(new TypeError('fetch failed'), { cause: Object.assign(new Error('socket closed'), { code }) });
}

describe('createRetryingFetch', () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('tries again when the connection to the model endpoint fails', async () => {
    // Arrange
    fetchMock.mockRejectedValueOnce(connectionError('ECONNRESET')).mockResolvedValueOnce(new Response('ok'));
    const retryingFetch = createRetryingFetch(2, 0);

    // Act
    const response = await retryingFetch('https://maas.test/v1/chat/completions', { method: 'POST', body: '{}' });

    // Assert
    expect(await response.text()).toBe('ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('tries again when the endpoint is briefly unavailable', async () => {
    // Arrange
    fetchMock
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    const retryingFetch = createRetryingFetch(2, 0);

    // Act
    const response = await retryingFetch('https://maas.test/v1/chat/completions');

    // Assert
    expect(response.status).toBe(200);
  });

  it('returns a rate limit at once, since the key stays limited until its window resets', async () => {
    // Arrange
    fetchMock.mockResolvedValue(new Response('limited', { status: 429 }));
    const retryingFetch = createRetryingFetch(2, 0);

    // Act
    const response = await retryingFetch('https://maas.test/v1/chat/completions');

    // Assert
    expect(response.status).toBe(429);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after the configured retries with the last failure', async () => {
    // Arrange
    fetchMock.mockRejectedValue(connectionError('UND_ERR_CONNECT_TIMEOUT'));
    const retryingFetch = createRetryingFetch(2, 0);

    // Act
    const result = retryingFetch('https://maas.test/v1/chat/completions');

    // Assert
    await expect(result).rejects.toThrow('fetch failed');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry an error that is not a connection failure, such as an untrusted certificate', async () => {
    // Arrange
    fetchMock.mockRejectedValue(connectionError('UNABLE_TO_GET_ISSUER_CERT'));
    const retryingFetch = createRetryingFetch(2, 0);

    // Act
    const result = retryingFetch('https://maas.test/v1/chat/completions');

    // Assert
    await expect(result).rejects.toThrow('fetch failed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('stops waiting to retry when the call is cancelled', async () => {
    // Arrange
    const controller = new AbortController();
    fetchMock.mockImplementation(async () => {
      controller.abort(new Error('cancelled'));
      throw connectionError('ECONNRESET');
    });
    const retryingFetch = createRetryingFetch(2, 0);

    // Act
    const result = retryingFetch('https://maas.test/v1/chat/completions', { signal: controller.signal });

    // Assert
    await expect(result).rejects.toThrow('fetch failed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
