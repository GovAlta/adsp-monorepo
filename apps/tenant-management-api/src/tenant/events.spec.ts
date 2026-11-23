import type { Tenant, User } from '@abgov/adsp-service-sdk';
import { TenantNameUpdatedDefinition, tenantNameUpdated } from './events';

describe('events', () => {
  describe('TenantNameUpdatedDefinition', () => {
    it('matches the name of the event sent on rename', () => {
      const event = tenantNameUpdated(
        { id: 'user-1', name: 'Tester' } as User,
        { id: 'tenant-1' } as unknown as Tenant,
      );
      expect(TenantNameUpdatedDefinition.name).toBe(event.name);
    });

    it('requires the payload fields the event sends', () => {
      const event = tenantNameUpdated(
        { id: 'user-1', name: 'Tester' } as User,
        { id: 'tenant-1' } as unknown as Tenant,
      );
      const schema = TenantNameUpdatedDefinition.payloadSchema as { required: string[] };
      expect(schema.required).toEqual(['tenant', 'updatedBy']);
      schema.required.forEach((field) => expect(event.payload).toHaveProperty(field));
      expect(event.payload.updatedBy).toEqual({ id: 'user-1', name: 'Tester' });
    });
  });
});
