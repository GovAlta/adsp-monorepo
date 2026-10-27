import { eventsToCsv } from './export';
import type { AuditEventRecord } from './models';

const event = (overrides: Partial<AuditEventRecord> = {}): AuditEventRecord => ({
  id: '1',
  namespace: 'form-app',
  occurredAt: '2026-01-01T00:00:00.000Z',
  action: 'submit',
  category: 'runtime',
  status: 'success',
  actor: { id: 'user-1' },
  ...overrides,
});

describe('eventsToCsv', () => {
  it('writes a header row and one row per event', () => {
    const lines = eventsToCsv([event(), event({ id: '2' })]).split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith('id,occurredAt,namespace,action')).toBe(true);
    expect(lines[1].startsWith('1,2026-01-01T00:00:00.000Z,form-app,submit')).toBe(true);
  });

  it('quotes values containing commas, quotes and newlines', () => {
    const csv = eventsToCsv([event({ actor: { id: 'u', name: 'Doe, "Jane"\nSmith' } })], true);
    expect(csv).toContain('"Doe, ""Jane""\nSmith"');
  });

  it('serializes change sets and metadata as JSON', () => {
    const csv = eventsToCsv([event({ metadata: { reason: 'x' }, changeSet: { after: { n: 1 } } })]);
    expect(csv).toContain('"{""after"":{""n"":1}}"');
    expect(csv).toContain('"{""reason"":""x""}"');
  });

  it('neutralizes values that a spreadsheet would run as a formula', () => {
    const csv = eventsToCsv([event({ actor: { id: 'u', name: '=HYPERLINK("http://x")' } })], true);
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`);
  });

  it('omits actor name and email unless personal information is included', () => {
    const events = [event({ actor: { id: 'u', name: 'Jane', email: 'jane@example.com' } })];

    const redacted = eventsToCsv(events);
    expect(redacted).not.toMatch(/actorName|actorEmail|Jane|jane@example.com/);
    expect(redacted).toContain('actorId');

    const full = eventsToCsv(events, true);
    expect(full).toContain('actorName,actorEmail');
    expect(full).toContain('Jane,jane@example.com');
  });
});
