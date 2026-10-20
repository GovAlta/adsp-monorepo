import { isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  createValidationHandler,
  decodeAfter,
  encodeNext,
  InvalidOperationError,
  NotFoundError,
  Results,
} from '@core-services/core-common';
import { RequestHandler } from 'express';
import { query, param } from 'express-validator';
import isISO8601 from 'validator/lib/isISO8601';
import * as HttpStatusCodes from 'http-status-codes';
import { AuditServiceRoles } from '../roles';
import { SelfAuditActions } from '../model';
import { AuditEvent, EventCriteria, EventReader, StoredEvent } from '../types';
import type { SelfAuditor } from '../utils/self-audit';

const DEFAULT_TOP = 10;
const MAX_TOP = 5000;

// Typed against the domain unions so a value that is not a valid status or category fails to compile.
const EVENT_STATUSES: AuditEvent['status'][] = ['success', 'failure', 'blocked', 'error'];
const EVENT_CATEGORIES: NonNullable<EventCriteria['category']>[] = [
  'administrative',
  'runtime',
  'security',
  'data-access',
];

export interface SerializeOptions {
  // Ordinary reads do not redact; redaction exists for responses that must hide identity from non-admins.
  redactActor?: boolean;
}

// The single point where stored rows become API responses. tenant_id never leaves here.
export function serializeEvent(event: StoredEvent, { redactActor = false }: SerializeOptions = {}) {
  return {
    id: event.id,
    eventId: event.event_id,
    namespace: event.namespace,
    writtenBy: event.written_by,
    occurredAt: event.occurred_at,
    receivedAt: event.received_at,
    action: event.action,
    actionVersion: event.action_version,
    category: event.category,
    status: event.status,
    severity: event.severity,
    actor: {
      id: event.actor_id,
      type: event.actor_type,
      ...(redactActor ? {} : { name: event.actor_name ?? undefined, email: event.actor_email ?? undefined }),
      roles: event.actor_roles,
    },
    resource: event.resource_type
      ? { type: event.resource_type, id: event.resource_id, name: event.resource_name ?? undefined }
      : undefined,
    scopeIds: event.scope_ids,
    correlationId: event.correlation_id ?? undefined,
    sessionId: event.session_id ?? undefined,
    changeSet:
      event.change_set_before || event.change_set_after
        ? { before: event.change_set_before, after: event.change_set_after }
        : undefined,
    metadata: event.metadata,
    retentionClass: event.retention_class,
    retentionUntil: event.retention_until,
  };
}

function assertCanReadEvents(req: Parameters<RequestHandler>[0]) {
  const tenantId = req.tenant?.id;
  if (!tenantId || !isAllowedUser(req.user, tenantId, AuditServiceRoles.Reader, true)) {
    throw new UnauthorizedUserError('read audit events', req.user);
  }
  return tenantId.toString();
}

function assertReader(reader?: EventReader): EventReader {
  if (!reader) {
    throw new InvalidOperationError('Audit event storage is not configured.', {
      statusCode: HttpStatusCodes.SERVICE_UNAVAILABLE,
    });
  }
  return reader;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function parseTop(value: unknown): number {
  const top = typeof value === 'string' ? parseInt(value, 10) : NaN;
  return Number.isInteger(top) && top >= 1 && top <= MAX_TOP ? top : DEFAULT_TOP;
}

function toDate(value: unknown): Date | undefined {
  const text = str(value);
  return text ? new Date(text) : undefined;
}

function toCriteria(req: Parameters<RequestHandler>[0], tenantId: string): EventCriteria {
  const q = req.query;
  return {
    tenantId,
    namespace: req.params.namespace,
    actor: str(q.actor),
    resourceType: str(q.resourceType),
    resourceId: str(q.resourceId),
    action: str(q.action),
    status: str(q.status) as EventCriteria['status'],
    category: str(q.category) as EventCriteria['category'],
    scope: str(q.scope),
    occurredFrom: toDate(q.occurredFrom),
    occurredTo: toDate(q.occurredTo),
  };
}

function toFilters({ tenantId: _tenantId, ...criteria }: EventCriteria): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(criteria)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
  );
}

function getEndpoint(req: Parameters<RequestHandler>[0]): string {
  return `${req.method} ${req.baseUrl}${req.route.path}`;
}

export function readEvents(reader?: EventReader, auditor?: SelfAuditor): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = assertCanReadEvents(req);
      const top = parseTop(req.query.top);
      const after = str(req.query.after);
      const skip = after ? decodeAfter(after) : 0;

      const criteria = toCriteria(req, tenantId);
      const events = await assertReader(reader).find(criteria, top, skip);
      const results: Results<ReturnType<typeof serializeEvent>> = {
        results: events.map((event) => serializeEvent(event)),
        page: { after, size: events.length, next: encodeNext(events.length, top, skip) },
      };
      res.send(results);
      await auditor?.record(req, {
        action: criteria.namespace ? SelfAuditActions.ListNamespaceEvents : SelfAuditActions.ListAllEvents,
        endpoint: getEndpoint(req),
        filters: toFilters(criteria),
        resultCount: events.length,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function readEvent(reader?: EventReader, auditor?: SelfAuditor): RequestHandler {
  return async (req, res, next) => {
    try {
      const tenantId = assertCanReadEvents(req);
      const { namespace, id } = req.params;
      const event = await assertReader(reader).get(tenantId, namespace, id);
      if (!event || event.tenant_id !== tenantId) {
        throw new NotFoundError('audit event', id);
      }
      res.send(serializeEvent(event));
      await auditor?.record(req, {
        action: SelfAuditActions.ReadEvent,
        endpoint: getEndpoint(req),
        filters: { namespace, id },
        resultCount: 1,
      });
    } catch (err) {
      next(err);
    }
  };
}

export const validateEventId = createValidationHandler(param('id').isUUID());

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

// Rejects week/ordinal dates and impossible dates (e.g. 2026-02-30) that Date would silently roll over or reject.
function parseIsoDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !ISO_DATE_PREFIX.test(value)) {
    return undefined;
  }
  if (!isISO8601(value, { strict: true, strictSeparator: true })) {
    return undefined;
  }
  const date = new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

function isValidCursor(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  const decoded = Buffer.from(value, 'base64').toString('ascii');
  const skip = decodeAfter(value);
  return /^\d+$/.test(decoded) && Number.isSafeInteger(skip);
}

const SCALAR_PARAMS = [
  'top',
  'after',
  'actor',
  'resourceType',
  'resourceId',
  'action',
  'scope',
  'status',
  'category',
  'occurredFrom',
  'occurredTo',
];

export const validateEventQuery = createValidationHandler(
  // Repeated or bracketed params (e.g. status[]=a) parse to arrays, which validators check per element and parsing drops.
  query(SCALAR_PARAMS)
    .optional()
    .custom((value) => typeof value === 'string')
    .withMessage('must be a single value'),
  query('top').optional().isInt({ min: 1, max: MAX_TOP }),
  query('after').optional().custom(isValidCursor).withMessage('after is not a valid cursor'),
  query(['actor', 'resourceType', 'resourceId', 'action', 'scope'])
    .optional()
    .isString()
    .isLength({ min: 1, max: 256 }),
  query('status').optional().isIn(EVENT_STATUSES),
  query('category').optional().isIn(EVENT_CATEGORIES),
  query(['occurredFrom', 'occurredTo'])
    .optional()
    .custom((value) => parseIsoDate(value) !== undefined)
    .withMessage('must be a valid ISO 8601 date'),
  query('occurredTo')
    .optional()
    .custom((value: string, { req }) => {
      const from = parseIsoDate(req.query?.occurredFrom);
      const to = parseIsoDate(value);
      return !from || !to || from <= to;
    })
    .withMessage('occurredTo must not be before occurredFrom'),
);
