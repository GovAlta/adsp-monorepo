import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Users } from 'keycloak-admin/lib/resources/users';
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
      value: { type: 'object' },
    },
  },
};

export function valueWritten(user: User, namespace: string, name: string, value: Value): DomainEvent {
  return {
    name: 'value-written',
    timestamp: new Date(),
    correlationId: value.correlationId,
    tenantId: value.tenantId,
    context: {
      namespace,
      name,
    },
    payload: {
      value,
      writtenBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}
