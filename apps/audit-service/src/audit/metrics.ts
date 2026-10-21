import type { Meter } from '@opentelemetry/api';
import type { Logger } from 'winston';
import { FailedEventRepository } from './types';

export interface AuditMetrics {
  recordParkedEvent(): void;
  recordWriteFailure(operation: 'ingest' | 'replay', count?: number): void;
}

export function createAuditMetrics(
  meter: Meter | undefined,
  repository: FailedEventRepository | undefined,
  logger: Logger,
): AuditMetrics {
  const parked = meter?.createCounter('audit.events.parked', { description: 'Durably parked audit events.' });
  const failures = meter?.createCounter('audit.write.failures', { description: 'Failed durable audit saves.' });
  const open = meter?.createObservableGauge('audit.failed.events.open', {
    description:
      'Open parked events across all tenants; NaN when unavailable. Shared database count, not a per-pod delta.',
  });
  const available = meter?.createObservableGauge('audit.failed.events.available', {
    description: 'Whether the failed-event repository count can be collected (1 available, 0 unavailable).',
  });
  if (!repository)
    logger.warn('Failed-event storage is not configured; administration and open-count collection unavailable.');
  meter?.addBatchObservableCallback(
    async (result) => {
      if (!repository) {
        result.observe(open, NaN);
        result.observe(available, 0);
        return;
      }
      try {
        const count = await repository.countOpen();
        if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid open failed-event count.');
        result.observe(open, count);
        result.observe(available, 1);
      } catch (err) {
        logger.error('Unable to collect open failed-event count.', { context: 'AuditMetrics', error: String(err) });
        // An omitted observation can retain the SDK's previous (possibly healthy) value.
        result.observe(open, NaN);
        result.observe(available, 0);
      }
    },
    [open, available],
  );
  return {
    recordParkedEvent: () => parked?.add(1),
    recordWriteFailure: (operation, count = 1) => failures?.add(count, { operation }),
  };
}
