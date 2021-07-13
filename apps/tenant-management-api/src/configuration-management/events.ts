import type { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { v4 as uuidv4 } from 'uuid';

export const CONFIGURATION_UPDATED = 'configuration-updated';

export const ConfigurationUpdatedDefinition: DomainEventDefinition = {
  name: CONFIGURATION_UPDATED,
  description: 'Signalled when tenant configuration is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      service: {
        type: 'string',
      },
      updatedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

export const configurationUpdated = (user: User, tenantId: AdspId, service?: string): DomainEvent => ({
  tenantId: tenantId,
  name: CONFIGURATION_UPDATED,
  timestamp: new Date(),
  correlationId: uuidv4(),
  payload: {
    service: service,
    updatedBy: {
      id: user.id,
      name: user.name,
    },
  },
});
