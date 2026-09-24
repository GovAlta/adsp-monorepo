import { InvalidOperationError } from '@core-services/core-common';
import { lastCompletedUtcDay, resolveReportPeriod } from './period';

describe('resolveReportPeriod', () => {
  const now = new Date('2026-09-17T23:15:00.000Z');

  it('clips to to the last completed UTC day', () => {
    expect(resolveReportPeriod('2026-08-18', '2026-09-17', now)).toEqual({
      from: '2026-08-18',
      to: '2026-09-16',
    });
  });

  it('keeps a completed to date', () => {
    expect(resolveReportPeriod('2026-08-18', '2026-09-16', now)).toEqual({
      from: '2026-08-18',
      to: '2026-09-16',
    });
  });

  it('rejects from after to', () => {
    expect(() => resolveReportPeriod('2026-09-16', '2026-08-18', now)).toThrow(InvalidOperationError);
  });

  it('accepts a span longer than 13 months', () => {
    expect(resolveReportPeriod('2020-01-01', '2026-09-16', now)).toEqual({
      from: '2020-01-01',
      to: '2026-09-16',
    });
  });

  it('rejects a non-iso date', () => {
    expect(() => resolveReportPeriod('08-18-2026', '2026-09-16', now)).toThrow(InvalidOperationError);
  });
});

describe('lastCompletedUtcDay', () => {
  it('returns yesterday UTC', () => {
    expect(lastCompletedUtcDay(new Date('2026-09-17T00:30:00.000Z')).toISOString()).toBe('2026-09-16T00:00:00.000Z');
  });
});

