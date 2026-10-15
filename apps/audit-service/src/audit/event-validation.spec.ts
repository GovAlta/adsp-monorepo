import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import {
  ActionValidator,
  EventRejectedError,
  getCapturedChangeSet,
  MAX_JSON_FIELD_BYTES,
  validateEventEnvelope,
} from './event-validation';
import { AuditEvent } from './types';

const receivedAt = new Date('2026-10-15T18:00:00.000Z');
const event: AuditEvent = {
  eventId: '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11',
  occurredAt: receivedAt.toISOString(),
  action: 'case.update.succeeded',
  status: 'success',
  actor: { id: 'case-worker', type: 'user' },
};
const definition: AuditActionDefinition = {
  version: 2,
  category: 'administrative',
  severity: 'info',
  retentionClass: 'compliance',
};

describe('event envelope validation', () => {
  it('preserves a valid event without modifying it', () => {
    const input = Object.freeze({ ...event, metadata: Object.freeze({ reason: 'resolved' }) });

    expect(validateEventEnvelope(input, receivedAt)).toBe(input);
  });

  it.each([
    null,
    [],
    'invalid',
    1,
    {},
    { ...event, eventId: 'not-a-uuid' },
    { ...event, occurredAt: 'yesterday' },
    { ...event, occurredAt: '2026-02-30T18:00:00Z' },
    { ...event, occurredAt: '2026-10-15T18:00:60Z' },
    { ...event, action: '' },
    { ...event, action: 'case update' },
    { ...event, actionVersion: '2' },
    { ...event, actionVersion: 0 },
    { ...event, actionVersion: 1.5 },
    { ...event, status: 'succeeded' },
    { ...event, actor: null },
    { ...event, actor: { id: 'case-worker' } },
    { ...event, actor: { id: '', type: 'user' } },
    { ...event, actor: { id: 'case-worker', type: 'admin' } },
    { ...event, actor: { id: 'case-worker', type: 'user', roles: 'admin' } },
    { ...event, resource: { id: 'CASE-1042' } },
    { ...event, scopeIds: 'office-calgary' },
    { ...event, sessionId: 's'.repeat(129) },
    { ...event, metadata: [] },
    { ...event, metadata: null },
  ])('rejects malformed event %# individually', (input) => {
    expect(() => validateEventEnvelope(input, receivedAt)).toThrow(EventRejectedError);
  });

  it.each(['2026-10-08T18:00:00.000Z', '2026-10-15T18:05:00.000Z', '2026-10-15T12:00:00-06:00'])(
    'accepts valid time boundary or offset %s',
    (occurredAt) => {
      expect(() => validateEventEnvelope({ ...event, occurredAt }, receivedAt)).not.toThrow();
    },
  );

  it.each(['2026-10-08T17:59:59.999Z', '2026-10-15T18:05:00.001Z'])(
    'rejects time outside the window %s',
    (occurredAt) => {
      expect(() => validateEventEnvelope({ ...event, occurredAt }, receivedAt)).toThrow(
        'past 7 days or next 5 minutes',
      );
    },
  );

  it.each(['metadata', 'changeSet'])('accepts exactly 16 KB of JSON in %s', (field) => {
    const value = { value: 'x'.repeat(MAX_JSON_FIELD_BYTES - Buffer.byteLength(JSON.stringify({ value: '' }))) };

    expect(Buffer.byteLength(JSON.stringify(value))).toBe(MAX_JSON_FIELD_BYTES);
    expect(() => validateEventEnvelope({ ...event, [field]: value }, receivedAt)).not.toThrow();
  });

  it.each(['metadata', 'changeSet'])('rejects one byte over 16 KB in %s', (field) => {
    const value = { value: 'x'.repeat(MAX_JSON_FIELD_BYTES - Buffer.byteLength(JSON.stringify({ value: '' })) + 1) };

    expect(() => validateEventEnvelope({ ...event, [field]: value }, receivedAt)).toThrow(`${field} exceeds`);
  });

  it('measures UTF-8 bytes rather than JavaScript character count', () => {
    const metadata = { value: '\u00e9'.repeat(MAX_JSON_FIELD_BYTES / 2) };

    expect(JSON.stringify(metadata).length).toBeLessThan(MAX_JSON_FIELD_BYTES);
    expect(() => validateEventEnvelope({ ...event, metadata }, receivedAt)).toThrow('metadata exceeds');
  });
});

describe('catalog event validation', () => {
  it.each([undefined, 2])('accepts absent or matching action version %s', (actionVersion) => {
    expect(() => new ActionValidator().validate({ ...event, actionVersion }, definition)).not.toThrow();
  });

  it('rejects an explicit different version', () => {
    expect(() => new ActionValidator().validate({ ...event, actionVersion: 1 }, definition)).toThrow(
      'supports version 2',
    );
  });

  it.each([undefined, { type: 'payment', id: 'PAYMENT-3' }])('requires the catalog resource type', (resource) => {
    expect(() =>
      new ActionValidator().validate({ ...event, resource }, { ...definition, resourceType: 'case' }),
    ).toThrow("requires resource type 'case'");
  });

  it('accepts a matching resource type', () => {
    const input = { ...event, resource: { type: 'case', id: 'CASE-1042' } };

    expect(() => new ActionValidator().validate(input, { ...definition, resourceType: 'case' })).not.toThrow();
  });

  it('validates metadata against the catalog schema without coercion', () => {
    const schema = { type: 'object', properties: { caseId: { type: 'integer' } }, required: ['caseId'] };

    expect(() =>
      new ActionValidator().validate(
        { ...event, metadata: { caseId: '42' } },
        { ...definition, metadataSchema: schema },
      ),
    ).toThrow(EventRejectedError);
  });

  it('validates omitted metadata as an empty object', () => {
    const schema = { type: 'object', required: ['reasonCode'] };

    expect(() => new ActionValidator().validate(event, { ...definition, metadataSchema: schema })).toThrow(
      'reasonCode',
    );
  });

  it('does not silently apply catalog defaults to event metadata', () => {
    const metadata = {};
    const action = {
      ...definition,
      metadataSchema: { type: 'object', properties: { reasonCode: { type: 'string', default: 'UNKNOWN' } } },
    };

    new ActionValidator().validate({ ...event, metadata }, action);

    expect(metadata).toEqual({});
  });

  it('reuses a validator for events sharing the same action within a request', () => {
    const validator = new ActionValidator();
    const action = { ...definition, metadataSchema: { type: 'object' } };

    validator.validate(event, action);

    expect(() => validator.validate(event, action)).not.toThrow();
  });

  it('keeps action schemas isolated when they reuse the same schema identifier', () => {
    const validator = new ActionValidator();
    const schema = { $id: 'urn:audit:metadata', type: 'object' };

    validator.validate(event, { ...definition, metadataSchema: { ...schema } });

    expect(() => validator.validate(event, { ...definition, metadataSchema: { ...schema } })).not.toThrow();
  });

  it.each([
    { $async: true, type: 'object' },
    { $ref: 'https://schemas.example.test/unavailable' },
    { type: 'object', properties: { reference: { type: 'string', format: 'unrecognized-format' } } },
  ])('treats an unusable metadata schema as a service failure, not an event rejection', (metadataSchema) => {
    expect(() => new ActionValidator().validate(event, { ...definition, metadataSchema })).toThrow(
      expect.objectContaining({ extra: { statusCode: 503 } }),
    );
  });
});

describe('change set capture', () => {
  it('drops change sets for actions which do not capture them', () => {
    expect(getCapturedChangeSet({ ...event, changeSet: 'discard this' }, definition)).toEqual({});
  });

  it('allows a capturing action to omit a change set', () => {
    expect(getCapturedChangeSet(event, { ...definition, captureChangeSet: true })).toEqual({});
  });

  it('preserves before and after including a null deletion value', () => {
    const changeSet = { before: { status: 'open' }, after: null };

    expect(getCapturedChangeSet({ ...event, changeSet }, { ...definition, captureChangeSet: true })).toBe(changeSet);
  });

  it.each([null, [], 'invalid', { before: [] }, { after: 42 }, { unexpected: true }])(
    'rejects malformed captured change set %#',
    (changeSet) => {
      expect(() => getCapturedChangeSet({ ...event, changeSet }, { ...definition, captureChangeSet: true })).toThrow(
        'Invalid changeSet',
      );
    },
  );
});
