import { adspId, User } from '@abgov/adsp-service-sdk';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationEntity } from './configuration';

describe('ConfigurationEntity', () => {
  const namespace = 'platform';
  const name = 'test-service';
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const repositoryMock = {
    get: jest.fn(),
    getRevisions: jest.fn(),
    saveRevision: jest.fn(),
  };
  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.saveRevision.mockClear();
    validationMock.validate.mockClear();
  });

  it('can be created', () => {
    const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
    expect(entity).toBeTruthy();
  });

  it('can throw for missing namespace', () => {
    expect(() => {
      new ConfigurationEntity(null, name, repositoryMock, validationMock);
    }).toThrow(/Configuration must have a namespace and name./);
  });

  it('can throw for missing name', () => {
    expect(() => {
      new ConfigurationEntity(namespace, null, repositoryMock, validationMock);
    }).toThrow(/Configuration must have a namespace and name./);
  });

  it('can throw for invalid namespace', () => {
    expect(() => {
      new ConfigurationEntity(':value', name, repositoryMock, validationMock);
    }).toThrow(/Configuration and namespace and name cannot contain ':'./);
  });

  it('can throw for invalid name', () => {
    expect(() => {
      new ConfigurationEntity(namespace, 'value:', repositoryMock, validationMock);
    }).toThrow(/Configuration and namespace and name cannot contain ':'./);
  });

  describe('canAccess', () => {
    it('can return false for null user', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canAccess(null);
      expect(result).toBeFalsy();
    });

    it('can return false for core user with null role', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: null } as User);
      expect(result).toBeFalsy();
    });

    it('can return false for core user without role', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for core service user accessing core context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core reader user accessing core context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core admin user accessing core context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core service user accessing tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core reader user accessing tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core admin user accessing tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant service user accessing tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant reader user accessing tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant admin user accessing tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for tenant user accessing different tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canAccess({
        isCore: false,
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeFalsy();
    });
  });

  describe('canModify', () => {
    it('can return false for null user', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canModify(null);
      expect(result).toBeFalsy();
    });

    it('can return false for core user with null role', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: null } as User);
      expect(result).toBeFalsy();
    });

    it('can return false for core user without role', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for core service user modifying core context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for core reader user modifying core context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for core admin user modifying core context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for core user modifying tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for tenant service user modifying tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canModify({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant admin user modifying tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canModify({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for tenant user modifying different tenant context', () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, null, tenantId);
      const result = entity.canModify({
        isCore: false,
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeFalsy();
    });
  });

  describe('update', () => {
    it('can update first revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);

      repositoryMock.saveRevision.mockImplementationOnce((_entity, rev) => rev);

      const updated = await entity.update(
        { isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User,
        {
          value: 'value',
        }
      );
      expect(updated.latest.revision).toBe(0);
      expect(updated.latest.configuration.value).toBe('value');
    });

    it('can update revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      repositoryMock.saveRevision.mockImplementationOnce((_entity, rev) => rev);

      const updated = await entity.update(
        { isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User,
        {
          value: 'value',
        }
      );
      expect(updated.latest.revision).toBe(2);
      expect(updated.latest.configuration['value']).toBe('value');
    });

    it('can throw for null configuration', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      await expect(
        entity.update({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User, null)
      ).rejects.toThrow(/Configuration must have a value./);
    });

    it('can throw for unauthorized user', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      await expect(entity.update({ id: 'test', name: 'test' } as User, {})).rejects.toThrow(
        /User test \(ID: test\) not permitted to modify configuration./
      );
    });

    it('can throw for invalid configuration', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      validationMock.validate.mockImplementationOnce(() => {
        throw new Error(`Provided configuration is not valid for 'platform:test-service'`);
      });

      await expect(
        entity.update({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User, {})
      ).rejects.toThrow(/Provided configuration is not valid for 'platform:test-service'/);
    });
  });

  describe('createRevision', () => {
    it('can create first revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock);

      repositoryMock.saveRevision.mockImplementationOnce((_entity, rev) => rev);

      const updated = await entity.createRevision({
        isCore: true,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(updated.latest.revision).toBe(0);
      expect(updated.latest.configuration).toBeTruthy();
    });

    it('can create new revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: { value: 'value' } as unknown,
      });

      repositoryMock.saveRevision.mockImplementationOnce((_entity, rev) => rev);

      const updated = await entity.createRevision({
        isCore: true,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(updated.latest.revision).toBe(3);
      expect(updated.latest.configuration['value']).toBe('value');
    });

    it('can throw for unauthorized user', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      await expect(entity.createRevision({ id: 'test', name: 'test' } as User)).rejects.toThrow(
        /User test \(ID: test\) not permitted to modify configuration./
      );
    });
  });

  describe('getRevisions', () => {
    it('can get revisions', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      const revisions = {};
      repositoryMock.getRevisions.mockResolvedValueOnce(revisions);

      const result = await entity.getRevisions(20, '123', { revision: 12 });
      expect(result).toBe(revisions);
      expect(repositoryMock.getRevisions).toHaveBeenCalledWith(
        entity,
        20,
        '123',
        expect.objectContaining({ revision: 12 })
      );
    });

    it('can get revisions with default args', async () => {
      const entity = new ConfigurationEntity(namespace, name, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      const revisions = {};
      repositoryMock.getRevisions.mockResolvedValueOnce(revisions);

      const result = await entity.getRevisions();
      expect(result).toBe(revisions);
      expect(repositoryMock.getRevisions).toHaveBeenCalledWith(entity, 10, null, null);
    });
  });
});
