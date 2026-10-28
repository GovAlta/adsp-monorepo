import { parsePayloadSearchQuery, validatePayloadSearchQuery } from './payloadSearch';

const bounds = {
  timestampMin: '2026-10-01T00:00:00.000Z',
  timestampMax: '2026-10-02T00:00:00.000Z',
};

describe('payload search query', () => {
  it.each([
    ['an unquoted string', 'jane@example.gov.ab.ca', 'jane@example.gov.ab.ca'],
    ['a JSON string', '"12345"', '12345'],
    ['a number', '12345', 12345],
    ['a boolean', 'true', true],
    ['null', 'null', null],
  ])('parses %s payload value', (_description, payloadValue, expected) => {
    const query = { ...bounds, payloadPath: 'applicant.contact.email', payloadValue };

    const result = parsePayloadSearchQuery(query);

    expect(result).toEqual({ payloadPath: 'applicant.contact.email', payloadValue: expected });
  });

  it('parses a nested JSON containment object', () => {
    const payload = { applicationId: '12345', decision: { status: 'submitted' } };

    const result = parsePayloadSearchQuery({ ...bounds, payload: JSON.stringify(payload) });

    expect(result).toEqual({ payload });
  });

  it.each([
    ['a missing payloadValue', { ...bounds, payloadPath: 'applicationId' }],
    ['a missing payloadPath', { ...bounds, payloadValue: '12345' }],
    ['an unbounded range', { payloadPath: 'applicationId', payloadValue: '12345' }],
    ['an invalid path', { ...bounds, payloadPath: '$.applicationId', payloadValue: '12345' }],
    ['an object path value', { ...bounds, payloadPath: 'application', payloadValue: '{"id":"12345"}' }],
    ['a malformed containment object', { ...bounds, payload: '{"applicationId"' }],
    ['an array containment expression', { ...bounds, payload: '["12345"]' }],
    [
      'both search approaches',
      { ...bounds, payloadPath: 'applicationId', payloadValue: '12345', payload: '{"status":"submitted"}' },
    ],
  ])('rejects %s', (_description, query) => {
    expect(() => validatePayloadSearchQuery(query)).toThrow();
  });

  it('accepts a bounded path/value search', () => {
    expect(
      validatePayloadSearchQuery({
        ...bounds,
        payloadPath: 'applicant.contact.email',
        payloadValue: 'jane@example.ca',
      }),
    ).toBe(true);
  });

  it('accepts a bounded JSON containment search', () => {
    expect(validatePayloadSearchQuery({ ...bounds, payload: '{"status":"submitted"}' })).toBe(true);
  });
});
