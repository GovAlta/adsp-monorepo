import { User, adspId } from '@abgov/adsp-service-sdk';
import { TopicTypeEntity } from './type';
import { ServiceRoles } from '../roles';

describe('TopicTypeEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  it('can be initialized', () => {
    const entity = new TopicTypeEntity(tenantId, {
      id: 'test',
      name: 'Test',
      adminRoles: [],
      commenterRoles: [],
      readerRoles: [],
    });

    expect(entity).toBeTruthy();
  });

  describe('canRead', () => {
    const entity = new TopicTypeEntity(tenantId, {
      id: 'test',
      name: 'Test',
      adminRoles: ['test-admin'],
      commenterRoles: ['test-commenter'],
      readerRoles: ['test-reader'],
    });

    it('can return false for user without role', async () => {
      const result = entity.canRead({ tenantId, id: 'tester', name: 'Tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return true for user with reader role', async () => {
      const result = entity.canRead({ tenantId, id: 'tester', name: 'Tester', roles: ['test-reader'] } as User);
      expect(result).toBe(true);
    });

    it('can return true for user with admin role', async () => {
      const result = entity.canRead({ tenantId, id: 'tester', name: 'Tester', roles: ['test-admin'] } as User);
      expect(result).toBe(true);
    });

    it('can return true for user with commenter role.', async () => {
      const result = entity.canRead({ tenantId, id: 'tester', name: 'Tester', roles: ['test-commenter'] } as User);
      expect(result).toBe(true);
    });
  });

  describe('canComment', () => {
    const entity = new TopicTypeEntity(tenantId, {
      id: 'test',
      name: 'Test',
      adminRoles: ['test-admin'],
      commenterRoles: ['test-commenter'],
      readerRoles: ['test-reader'],
    });

    it('can return false for user without role', async () => {
      const result = entity.canComment({ tenantId, id: 'tester', name: 'Tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return false for user with reader role', async () => {
      const result = entity.canComment({ tenantId, id: 'tester', name: 'Tester', roles: ['test-reader'] } as User);
      expect(result).toBe(false);
    });

    it('can return true for user with admin role', async () => {
      const result = entity.canComment({ tenantId, id: 'tester', name: 'Tester', roles: ['test-admin'] } as User);
      expect(result).toBe(true);
    });

    it('can return true for user with commenter role.', async () => {
      const result = entity.canComment({ tenantId, id: 'tester', name: 'Tester', roles: ['test-commenter'] } as User);
      expect(result).toBe(true);
    });
  });

  describe('canAdmin', () => {
    const entity = new TopicTypeEntity(tenantId, {
      id: 'test',
      name: 'Test',
      adminRoles: ['test-admin'],
      commenterRoles: ['test-commenter'],
      readerRoles: ['test-reader'],
    });

    it('can return false for user without role', async () => {
      const result = entity.canAdmin({ tenantId, id: 'tester', name: 'Tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return false for user with reader role', async () => {
      const result = entity.canAdmin({ tenantId, id: 'tester', name: 'Tester', roles: ['test-reader'] } as User);
      expect(result).toBe(false);
    });

    it('can return true for user with admin role', async () => {
      const result = entity.canComment({ tenantId, id: 'tester', name: 'Tester', roles: ['test-admin'] } as User);
      expect(result).toBe(true);
    });

    it('can return true for user service admin role', async () => {
      const result = entity.canComment({ tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.Admin] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user with commenter role.', async () => {
      const result = entity.canAdmin({ tenantId, id: 'tester', name: 'Tester', roles: ['test-commenter'] } as User);
      expect(result).toBe(false);
    });
  });
});
