import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Value } from './types';

export const ValueWrittenDefinition: DomainEventDefinition = {
  name: 'value-written',
  description: 'Signalled when a value is written to',
  payloadSchema: {
    type: 'object',
    properties: {
      writtenBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      timestamp: { type: 'string', format: 'date-time' },
      value: {},
    },
  },
  log: {
    skip: true
  }
};

export function valueWritten(
  user: User,
  namespace: string,
  name: string,
  { context, correlationId, tenantId, timestamp, value }: Value
): DomainEvent {
  return {
    name: 'value-written',
    timestamp: new Date(),
    correlationId: correlationId,
    tenantId: tenantId,
    context: {
      ...(context || {}),
      namespace,
      name,
    },
    payload: {
      timestamp,
      value,
      writtenBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}
