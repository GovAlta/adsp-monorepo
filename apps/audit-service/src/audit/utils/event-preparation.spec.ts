import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import { AuditEvent } from '../types';
import { enrichEvent } from './event-preparation';

describe('enrichEvent retention', () => {
  const occurredAt = new Date('2026-10-15T18:00:00.000Z');
  const event: AuditEvent = {
    eventId: '0b9f6a8e-5d8c-4f6f-9a52-7c2d1f0e4b11',
    occurredAt: occurredAt.toISOString(),
    action: 'case.update.succeeded',
    status: 'success',
    actor: { id: 'case-worker', type: 'user' },
  };
  const context = { tenantId: 'tenant', namespace: 'cases', writtenBy: 'cases', receivedAt: occurredAt };
  const classes = { standard: { days: 90 }, compliance: { days: 365 }, custom: { days: 30 } };
  const definition: AuditActionDefinition = { version: 1, category: 'administrative', severity: 'info' };

  it('derives the retention class from the category when the action sets none', () => {
    const enriched = enrichEvent(event, definition, context, classes);

    expect(enriched.retention_class).toBe('compliance');
    expect(enriched.retention_until).toEqual(new Date('2027-10-15T18:00:00.000Z'));
  });

  it('uses the retention class set on the action over the category default', () => {
    const enriched = enrichEvent(event, { ...definition, retentionClass: 'custom' }, context, classes);

    expect(enriched.retention_class).toBe('custom');
    expect(enriched.retention_until).toEqual(new Date('2026-11-14T18:00:00.000Z'));
  });
});
