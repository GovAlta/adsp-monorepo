// [IMPL-DEFERRED: INT-007] — ADSP Event Service (RabbitMQ) domain event publication
// This stub logs events but does NOT transmit to live RabbitMQ.
// ADSP event service requires live platform provisioning (SYSREQ-011).
// Six event types per BR-012: session-created, session-updated, session-completed,
// session-archived, hypothesis-generated, specialist-delegated.
//
// X-Integration-Stubbed: INT-007
// Implementation status: fire-and-forget stub

import { Logger } from 'winston';
import { DomainEventType } from '../types';

export interface DomainEventPayload {
  eventType: DomainEventType;
  sessionId: string;
  tenantId: string;
  userId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface IEventService {
  publishEvent(payload: DomainEventPayload): Promise<void>;
}

/**
 * EventService — stub implementation of INT-007 (ADSP RabbitMQ event publication).
 *
 * [IMPL-DEFERRED: INT-007]
 * This class logs domain events to the service logger but does NOT connect to or
 * publish to any AMQP/RabbitMQ broker. Replace the stub body with the ADSP SDK
 * eventService.send() call when INT-007 is enabled.
 *
 * Response header: X-Integration-Stubbed: INT-007
 */
export class EventService implements IEventService {
  constructor(private readonly logger: Logger) {}

  // ✓ ASVS:V7.2.2 — domain events logged for traceability even when stub
  async publishEvent(payload: DomainEventPayload): Promise<void> {
    // [IMPL-DEFERRED: INT-007] — stub: log only, no live AMQP transmission
    this.logger.info('[INT-007 STUB] Domain event logged (not transmitted)', {
      eventType: payload.eventType,
      sessionId: payload.sessionId,
      tenantId: payload.tenantId,
      timestamp: payload.timestamp,
      // ✓ ASVS:V7.1.1 — payload data not logged to avoid Protected B content in logs
    });
    // No-op: return immediately without network call
  }
}
