'use strict';

/**
 * Unit tests for jira-client.js
 *
 * All network access is mocked via globalThis.fetch so no real HTTP calls
 * are made during the test run.  Env vars are set before the module is
 * required to mirror the CI environment.
 */

// Set required env vars before requiring the module so module-level
// constants are populated — same pattern as github-pr-clean-code-review.test.js
process.env.JIRA_BASE_URL = 'https://goa-dio.atlassian.net';
process.env.JIRA_EMAIL = 'test@example.com';
process.env.JIRA_API_TOKEN = 'test-token';

const { buildAuthHeader, adfToText, extractAcceptanceCriteria, fetchTicket } = require('./jira-client');

// ─── buildAuthHeader ──────────────────────────────────────────────────────────

describe('buildAuthHeader', () => {
  test('returns a Base64-encoded Basic Auth string', () => {
    const header = buildAuthHeader('user@example.com', 'secret');
    const decoded = Buffer.from(header.replace('Basic ', ''), 'base64').toString('utf8');
    expect(decoded).toBe('user@example.com:secret');
  });

  test('starts with "Basic "', () => {
    expect(buildAuthHeader('a', 'b')).toMatch(/^Basic /);
  });
});

// ─── adfToText ────────────────────────────────────────────────────────────────

describe('adfToText', () => {
  test('returns an empty string when node is null', () => {
    expect(adfToText(null)).toBe('');
  });

  test('returns an empty string when node is undefined', () => {
    expect(adfToText(undefined)).toBe('');
  });

  test('extracts text from a simple text node', () => {
    expect(adfToText({ type: 'text', text: 'hello' })).toBe('hello');
  });

  test('returns a newline for a hardBreak node', () => {
    expect(adfToText({ type: 'hardBreak' })).toBe('\n');
  });

  test('appends a newline after a paragraph node', () => {
    const node = { type: 'paragraph', content: [{ type: 'text', text: 'line' }] };
    expect(adfToText(node)).toBe('line\n');
  });

  test('appends a newline after a heading node', () => {
    const node = { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] };
    expect(adfToText(node)).toBe('Title\n');
  });

  test('prefixes list items with "- "', () => {
    const node = { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'item' }] }] };
    expect(adfToText(node)).toContain('- ');
  });

  test('recursively concatenates nested content in a doc node', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'second' }] },
      ],
    };
    const result = adfToText(doc);
    expect(result).toContain('first');
    expect(result).toContain('second');
  });
});

// ─── extractAcceptanceCriteria ────────────────────────────────────────────────

describe('extractAcceptanceCriteria', () => {
  test('returns null when descriptionAdf is null', () => {
    expect(extractAcceptanceCriteria(null)).toBeNull();
  });

  test('returns null when there is no Acceptance Criteria heading', () => {
    const adf = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Some description' }] }],
    };
    expect(extractAcceptanceCriteria(adf)).toBeNull();
  });

  test('returns the text content that follows an "Acceptance Criteria" heading', () => {
    const adf = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Acceptance Criteria' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Must pass all tests' }] },
      ],
    };
    expect(extractAcceptanceCriteria(adf)).toContain('Must pass all tests');
  });

  test('stops collecting content at the next heading after Acceptance Criteria', () => {
    const adf = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Acceptance Criteria' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'AC text' }] },
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Notes' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'should not appear' }] },
      ],
    };
    const result = extractAcceptanceCriteria(adf);
    expect(result).toContain('AC text');
    expect(result).not.toContain('should not appear');
  });

  test('is case-insensitive for the Acceptance Criteria heading', () => {
    const adf = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'ACCEPTANCE CRITERIA' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'criteria text' }] },
      ],
    };
    expect(extractAcceptanceCriteria(adf)).toContain('criteria text');
  });
});

// ─── fetchTicket ──────────────────────────────────────────────────────────────

describe('fetchTicket', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const makeAdfDescription = (text) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
  });

  const makeSuccessResponse = (fields) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ fields }),
  });

  test('returns null and logs a warning when Jira credentials are not configured', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Credentials are module-level constants captured at require() time, so we must
    // re-require the module with env vars cleared inside an isolated module registry.
    const savedBase = process.env.JIRA_BASE_URL;
    const savedEmail = process.env.JIRA_EMAIL;
    const savedToken = process.env.JIRA_API_TOKEN;

    delete process.env.JIRA_BASE_URL;
    delete process.env.JIRA_EMAIL;
    delete process.env.JIRA_API_TOKEN;

    let fetchTicketWithoutCredentials;
    jest.isolateModules(() => {
      ({ fetchTicket: fetchTicketWithoutCredentials } = require('./jira-client'));
    });

    process.env.JIRA_BASE_URL = savedBase;
    process.env.JIRA_EMAIL = savedEmail;
    process.env.JIRA_API_TOKEN = savedToken;

    const result = await fetchTicketWithoutCredentials('CS-1234');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('credentials not configured'));
  });

  test('calls the Jira REST API with the correct URL for the given ticket ID', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeSuccessResponse({ summary: 'Test ticket', description: null }));

    await fetchTicket('CS-1234');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://goa-dio.atlassian.net/rest/api/3/issue/CS-1234',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  test('includes a Basic Auth header in the request', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(makeSuccessResponse({ summary: 'x', description: null }));

    await fetchTicket('CS-1234');

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers.Authorization).toMatch(/^Basic /);
  });

  test('returns summary and null description when fields.description is absent', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeSuccessResponse({ summary: 'My ticket', description: null }));

    const result = await fetchTicket('CS-1234');

    expect(result).toEqual({ summary: 'My ticket', description: null, acceptanceCriteria: null });
  });

  test('returns parsed description text from ADF when description is present', async () => {
    const descriptionAdf = makeAdfDescription('Implement the feature');
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeSuccessResponse({ summary: 'Feature ticket', description: descriptionAdf }));

    const result = await fetchTicket('CS-1234');

    expect(result.description).toContain('Implement the feature');
  });

  test('returns acceptanceCriteria when an Acceptance Criteria heading is present in the description', async () => {
    const descriptionAdf = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Acceptance Criteria' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Must be unit tested' }] },
      ],
    };
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(makeSuccessResponse({ summary: 'AC ticket', description: descriptionAdf }));

    const result = await fetchTicket('CS-9999');

    expect(result.acceptanceCriteria).toContain('Must be unit tested');
  });

  test('returns null and logs a warning when the network call throws', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await fetchTicket('CS-1234');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Jira unreachable'));
  });

  test('returns null and logs a warning when the response status is 404', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await fetchTicket('CS-0000');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found (404)'));
  });

  test('returns null and logs a warning when the response status is not ok', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await fetchTicket('CS-1234');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
  });

  test('returns null and logs a warning when the response body cannot be parsed as JSON', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('invalid json')),
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await fetchTicket('CS-1234');

    expect(result).toBeNull();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Could not parse'));
  });
});
