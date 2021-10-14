/* eslint-disable @typescript-eslint/no-empty-function */
import { AssertRole } from './assert';
import { adspId, AdspId } from '../utils';
import { User } from './user';
import { AssertCoreRole, UnauthorizedUserError } from '.';

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

class TestEntity {
  @AssertRole('test', 'const-tester')
  static requireConstantRoleOnStatic(_user: User) {}

  // This is not proper usage since the instance property of 'roles' is not available in a static context.
  @AssertRole('test', null, 'roles')
  static requireDynamicRoleOnStatic(_user: User) {}

  constructor(private tenantId: AdspId, private roles: string[], private roles2?: string[]) {}

  @AssertRole('test', 'const-tester')
  requireConstantRole(_user: User) {}

  @AssertRole('test', ['const-tester', 'const-tester-2'])
  requireOneOfConstantRoles(_user: User) {}

  @AssertRole('test', null, 'roles')
  requireDynamicRole(_user: User) {}

  @AssertRole('test', null, ['roles', 'roles2'])
  requireOneOfDynamicRoleProperties(_user: User) {}

  @AssertRole('test', 'const-tester', null, true)
  requireConstantRoleAllowCore(_user: User) {}

  @AssertCoreRole('test', 'const-tester')
  requireCoreConstantRole(_user: User) {}
}

describe('assert', () => {
  describe('AssertRole', () => {
    describe('static method', () => {
      it('can assert constant tenant role', () => {
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: ['const-tester'],
        };
        TestEntity.requireConstantRoleOnStatic(user as unknown as User);
      });

      it('can throw for missing tenant role', () => {
        const user = {
          tenantId,
          id: 'tester',
          roles: [],
        };
        expect(() => TestEntity.requireConstantRoleOnStatic(user as unknown as User)).toThrowError(
          UnauthorizedUserError
        );
      });
    });

    describe('static method dynamic roles', () => {
      it('can throw for missing role', () => {
        const user = {
          tenantId,
          id: 'tester',
          roles: ['roles'],
        };
        expect(() => TestEntity.requireDynamicRoleOnStatic(user as unknown as User)).toThrowError(
          UnauthorizedUserError
        );
      });

      it('can throw for missing property name as role', () => {
        const user = {
          tenantId,
          id: 'tester',
          roles: [],
        };
        expect(() => TestEntity.requireDynamicRoleOnStatic(user as unknown as User)).toThrowError(
          UnauthorizedUserError
        );
      });
    });

    describe('instance method', () => {
      it('can assert constant tenant role', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: ['const-tester'],
        };
        entity.requireConstantRole(user as unknown as User);
      });

      it('can throw for falsy user', () => {
        const entity = new TestEntity(tenantId, []);
        expect(() => entity.requireConstantRole(null)).toThrowError(UnauthorizedUserError);
      });

      it('can throw for falsy roles', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: null,
        };
        expect(() => entity.requireConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });

      it('can throw for missing tenant role', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId,
          id: 'tester',
          roles: [],
        };
        expect(() => entity.requireConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });

      it('can throw for core user', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          isCore: true,
          id: 'tester',
          roles: ['const-tester'],
        };
        expect(() => entity.requireConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });

      it('can throw for user of wrong tenant', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test-2`,
          id: 'tester',
          roles: ['const-tester'],
        };
        expect(() => entity.requireConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });
    });

    describe('instance method one of roles', () => {
      it('can assert constant tenant role', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: ['const-tester-2'],
        };
        entity.requireOneOfConstantRoles(user as unknown as User);
      });

      it('can throw for missing all roles', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId,
          id: 'tester',
          roles: ['tester-3'],
        };
        expect(() => entity.requireConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });
    });

    describe('instance method dynamic roles', () => {
      it('can assert constant tenant role', () => {
        const entity = new TestEntity(tenantId, ['dynamic-tester']);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: ['dynamic-tester'],
        };
        entity.requireDynamicRole(user as unknown as User);
      });

      it('can throw for missing all roles', () => {
        const entity = new TestEntity(tenantId, ['dynamic-tester']);
        const user = {
          tenantId,
          id: 'tester',
          roles: [],
        };
        expect(() => entity.requireConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });
    });

    describe('instance method dynamic roles one of role properties', () => {
      it('can assert constant tenant role', () => {
        const entity = new TestEntity(tenantId, ['dynamic-tester'], ['dynamic-tester-2']);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: ['dynamic-tester-2'],
        };
        entity.requireOneOfDynamicRoleProperties(user as unknown as User);
      });

      it('can throw for missing all roles', () => {
        const entity = new TestEntity(tenantId, ['dynamic-tester']);
        const user = {
          tenantId,
          id: 'tester',
          roles: [],
        };
        expect(() => entity.requireOneOfDynamicRoleProperties(user as unknown as User)).toThrowError(
          UnauthorizedUserError
        );
      });
    });

    describe('instance method allow core', () => {
      it('can assert constant tenant role', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
          id: 'tester',
          roles: ['const-tester'],
        };
        entity.requireConstantRoleAllowCore(user as unknown as User);
      });

      it('can assert constant core role', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          isCore: true,
          id: 'tester',
          roles: ['const-tester'],
        };
        entity.requireConstantRoleAllowCore(user as unknown as User);
      });
    });
  });

  describe('AssertCoreRole', () => {
    describe('instance method', () => {
      it('can assert constant core role', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          isCore: true,
          id: 'tester',
          roles: ['const-tester'],
        };
        entity.requireCoreConstantRole(user as unknown as User);
      });

      it('can throw for falsy user', () => {
        const entity = new TestEntity(tenantId, []);
        expect(() => entity.requireCoreConstantRole(null)).toThrowError(UnauthorizedUserError);
      });

      it('can throw for falsy roles', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          isCore: true,
          id: 'tester',
          roles: null,
        };
        expect(() => entity.requireCoreConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });

      it('can throw for tenant user', () => {
        const entity = new TestEntity(tenantId, []);
        const user = {
          tenantId,
          id: 'tester',
          roles: ['const-tester'],
        };
        expect(() => entity.requireCoreConstantRole(user as unknown as User)).toThrowError(UnauthorizedUserError);
      });
    });
  });
});
