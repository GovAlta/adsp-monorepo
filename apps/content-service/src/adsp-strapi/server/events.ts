import { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const UserRegisteredEventDefinition: DomainEventDefinition = {
  name: 'user-registered',
  description: 'Signalled when a user is registered for access to the content manager.',
  payloadSchema: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      registrationUrl: { type: 'string' },
      isEditor: { type: 'boolean' },
    },
  },
};

interface NewUser {
  email: string;
  firstName: string;
  lastName: string;
  registrationUrl: string;
  isEditor: boolean;
}

export const userRegistered = (
  tenantId: AdspId,
  { email, firstName, lastName, registrationUrl, isEditor }: NewUser,
): DomainEvent => ({
  tenantId,
  name: UserRegisteredEventDefinition.name,
  timestamp: new Date(),
  payload: {
    email,
    firstName,
    lastName,
    registrationUrl,
    isEditor,
  },
});
