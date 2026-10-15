import { AuditActionDefinition } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { AuditEvent } from '../types';

export const MAX_JSON_FIELD_BYTES = 16 * 1024;
const MAX_EVENT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const nonemptyString = { type: 'string', minLength: 1 };
const stringArray = { type: 'array', items: nonemptyString };
const createAjv = () => addFormats(new Ajv({ allErrors: true, strict: false, strictSchema: true }));
const ajv = createAjv();
const validateEnvelope = ajv.compile<AuditEvent>({
  type: 'object',
  required: ['eventId', 'occurredAt', 'action', 'status', 'actor'],
  properties: {
    eventId: { type: 'string', format: 'uuid' },
    occurredAt: { type: 'string', format: 'date-time' },
    action: { type: 'string', pattern: '^[a-zA-Z0-9]+(?:[._:-][a-zA-Z0-9]+)*$' },
    actionVersion: { type: 'integer', minimum: 1 },
    status: { enum: ['success', 'failure', 'blocked', 'error'] },
    actor: {
      type: 'object',
      required: ['id', 'type'],
      properties: {
        id: nonemptyString,
        type: { enum: ['user', 'service', 'system'] },
        name: { type: 'string' },
        email: { type: 'string' },
        roles: stringArray,
      },
    },
    resource: {
      type: 'object',
      required: ['type', 'id'],
      properties: { type: nonemptyString, id: nonemptyString, name: { type: 'string' } },
    },
    scopeIds: stringArray,
    correlationId: nonemptyString,
    sessionId: { type: 'string', maxLength: 128 },
    metadata: { type: 'object' },
  },
});

interface ChangeSet {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}
const validateChangeSet = ajv.compile<ChangeSet>({
  type: 'object',
  properties: { before: { type: ['object', 'null'] }, after: { type: ['object', 'null'] } },
  additionalProperties: false,
});

export class EventRejectedError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    Object.setPrototypeOf(this, EventRejectedError.prototype);
  }
}

export function validateEventEnvelope(input: unknown, receivedAt: Date): AuditEvent {
  if (!validateEnvelope(input)) {
    throw new EventRejectedError('invalid_event', ajv.errorsText(validateEnvelope.errors));
  }
  const occurredAt = Date.parse(input.occurredAt);
  if (
    !Number.isFinite(occurredAt) ||
    occurredAt < receivedAt.getTime() - MAX_EVENT_AGE_MS ||
    occurredAt > receivedAt.getTime() + MAX_CLOCK_SKEW_MS
  ) {
    throw new EventRejectedError('invalid_event', 'occurredAt must be within the past 7 days or next 5 minutes.');
  }
  for (const field of ['metadata', 'changeSet'] as const) {
    if (input[field] !== undefined && Buffer.byteLength(JSON.stringify(input[field]), 'utf8') > MAX_JSON_FIELD_BYTES) {
      throw new EventRejectedError('invalid_event', `${field} exceeds the 16 KB JSON limit.`);
    }
  }
  return input;
}

export function getCapturedChangeSet(event: AuditEvent, definition: AuditActionDefinition): ChangeSet {
  if (!definition.captureChangeSet || event.changeSet === undefined) return {};
  if (!validateChangeSet(event.changeSet)) {
    throw new EventRejectedError('invalid_event', `Invalid changeSet: ${ajv.errorsText(validateChangeSet.errors)}`);
  }
  return event.changeSet;
}

export class ActionValidator {
  private readonly metadataValidators = new Map<AuditActionDefinition, ValidateFunction>();

  validate(event: AuditEvent, definition: AuditActionDefinition): void {
    if (event.actionVersion !== undefined && event.actionVersion !== definition.version) {
      throw new EventRejectedError(
        'action_version_mismatch',
        `Action '${event.action}' supports version ${definition.version}; received ${event.actionVersion}.`,
      );
    }
    if (definition.resourceType && event.resource?.type !== definition.resourceType) {
      throw new EventRejectedError(
        'invalid_resource',
        `Action '${event.action}' requires resource type '${definition.resourceType}'.`,
      );
    }
    if (definition.metadataSchema) {
      const validate = this.getMetadataValidator(definition);
      if (!validate(event.metadata ?? {})) {
        throw new EventRejectedError('invalid_metadata', ajv.errorsText(validate.errors));
      }
    }
  }

  private getMetadataValidator(definition: AuditActionDefinition): ValidateFunction {
    let validate = this.metadataValidators.get(definition);
    if (!validate) {
      try {
        if (definition.metadataSchema.$async) throw new Error('Async metadata schemas are not supported.');
        // Catalogs are independent schema documents, including when two actions reuse a schema $id.
        validate = createAjv().compile(definition.metadataSchema);
      } catch {
        throw new InvalidOperationError('The action metadata schema cannot be compiled. Contact the catalog owner.', {
          statusCode: 503,
        });
      }
      this.metadataValidators.set(definition, validate);
    }
    return validate;
  }
}
