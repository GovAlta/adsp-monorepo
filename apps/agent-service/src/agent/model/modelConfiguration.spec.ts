const mockEnvironment = {
  MODEL: 'gpt-5.1',
  MODEL_URL: 'https://models.test/openai/v1',
  MODEL_API_KEY: 'model-key',
};

jest.mock('../../environments/environment', () => ({ environment: mockEnvironment }));

import type { LanguageModelV3 } from '@ai-sdk/provider';
import { getAgentModelConfiguration } from './modelConfiguration';

const PROMPT = [
  { role: 'user' as const, content: [{ type: 'text' as const, text: 'Which clients are in the realm?' }] },
];

describe('getAgentModelConfiguration', () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    mockEnvironment.MODEL_URL = 'https://models.test/openai/v1';
    fetchMock
      .mockReset()
      .mockResolvedValue(new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } }));
    globalThis.fetch = fetchMock;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  async function streamOnce(model: LanguageModelV3) {
    await model.doStream({ prompt: PROMPT });
    const [url, request] = fetchMock.mock.calls[0];
    return { url, request, body: JSON.parse(request.body) };
  }

  it('asks the endpoint to report token usage on streamed replies', async () => {
    // Arrange
    const model = getAgentModelConfiguration() as LanguageModelV3;

    // Act
    const { body } = await streamOnce(model);

    // Assert
    expect(body.stream_options).toEqual({ include_usage: true });
  });

  it('calls the configured endpoint with the configured model', async () => {
    // Arrange
    const model = getAgentModelConfiguration('gpt-5.1-mini') as LanguageModelV3;

    // Act
    const { url, body } = await streamOnce(model);

    // Assert
    expect(url).toBe('https://models.test/openai/v1/chat/completions');
    expect(body.model).toBe('gpt-5.1-mini');
  });

  it('sends the headers configured on the agent', async () => {
    // Arrange
    const model = getAgentModelConfiguration('gpt-5.1', {
      headers: { 'x-tenant-route': 'autotest' },
    }) as LanguageModelV3;

    // Act
    const { request } = await streamOnce(model);

    // Assert
    expect(request.headers).toMatchObject({ 'x-tenant-route': 'autotest', authorization: 'Bearer model-key' });
  });

  it('uses the model ID as is without an OpenAI-compatible endpoint', () => {
    // Arrange
    mockEnvironment.MODEL_URL = '';

    // Act
    const model = getAgentModelConfiguration('github-models/openai/gpt-4.1');

    // Assert
    expect(model).toBe('github-models/openai/gpt-4.1');
  });
});
