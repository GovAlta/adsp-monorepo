import { adspId, User } from '@abgov/adsp-service-sdk';
import type { Logger } from 'winston';
import { ConfigurationServiceRoles } from '../roles';
import { ConfigurationDefinition } from '../types';
import { ConfigurationEntity } from './configuration';

describe('ConfigurationEntity', () => {
  const namespace = 'platform';
  const name = 'test-service';
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const definition: ConfigurationDefinition = {
    anonymousRead: true,
    configurationSchema: { type: 'object', properties: { a: { type: 'object' } } },
  };
  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    getRevisions: jest.fn(),
    saveRevision: jest.fn(),
    getActiveRevision: jest.fn(),
    clearActiveRevision: jest.fn(),
    setActiveRevision: jest.fn(),
  };
  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    repositoryMock.saveRevision.mockClear();
    repositoryMock.delete.mockClear();
    repositoryMock.getActiveRevision.mockClear();
    repositoryMock.setActiveRevision.mockClear();
    validationMock.validate.mockClear();
  });

  it('can be created', () => {
    const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
    expect(entity).toBeTruthy();
  });

  it('can throw for missing namespace', () => {
    expect(() => {
      new ConfigurationEntity(null, name, loggerMock, repositoryMock, validationMock);
    }).toThrow(/Configuration must have a namespace and name./);
  });

  it('can throw for missing name', () => {
    expect(() => {
      new ConfigurationEntity(namespace, null, loggerMock, repositoryMock, validationMock);
    }).toThrow(/Configuration must have a namespace and name./);
  });

  it('can throw for invalid namespace', () => {
    expect(() => {
      new ConfigurationEntity(':value', name, loggerMock, repositoryMock, validationMock);
    }).toThrow(/Configuration and namespace and name cannot contain ':'./);
  });

  it('can handle invalid schema', () => {
    const configurationSchema = {
      type: 'object',
      properties: { valueA: { type: 'number' } },
      additionalProperties: null,
    };
    const revisedDefinition: ConfigurationDefinition = { ...definition, configurationSchema };
    validationMock.setSchema.mockImplementationOnce(() => {
      throw new Error('');
    });
    new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, null, null, revisedDefinition);
    expect(loggerMock.warn).toBeCalledWith(
      'JSON schema of platform:test-service is invalid. An empty JSON schema {} will be used.'
    );
  });

  describe('canAccess', () => {
    it('can return false for null user', () => {
      const revisedDefinition: ConfigurationDefinition = { ...definition, anonymousRead: false };
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        null,
        revisedDefinition
      );
      const result = entity.canAccess(null);
      expect(result).toBeFalsy();
    });

    it('can return false for core user with null role', () => {
      const revisedDefinition: ConfigurationDefinition = { ...definition, anonymousRead: false };
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        null,
        revisedDefinition
      );
      const result = entity.canAccess({ isCore: true, roles: null } as User);
      expect(result).toBeFalsy();
    });

    it('can return false for core user without role', () => {
      const revisedDefinition: ConfigurationDefinition = { ...definition, anonymousRead: false };

      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        null,
        revisedDefinition
      );
      const result = entity.canAccess({ isCore: true, roles: [] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for core service user accessing core context', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core reader user accessing core context', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core admin user accessing core context', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core service user accessing tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core reader user accessing tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core admin user accessing tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canAccess({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant service user accessing tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canAccess({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant reader user accessing tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canAccess({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfiguredService],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant admin user accessing tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canAccess({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for tenant user accessing different tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
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
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canModify(null);
      expect(result).toBeFalsy();
    });

    it('can return false for core user with null role', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: null } as User);
      expect(result).toBeFalsy();
    });

    it('can return false for core user without role', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for core service user modifying core context', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for core reader user modifying core context', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.Reader] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for core admin user modifying core context', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for core user modifying tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canModify({ isCore: true, roles: [ConfigurationServiceRoles.ConfigurationAdmin] } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant service user modifying tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canModify({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return true for tenant admin user modifying tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canModify({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for tenant user modifying different tenant context', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        null,
        tenantId
      );
      const result = entity.canModify({
        isCore: false,
        tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test2`,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeFalsy();
    });
  });

  describe('canRegister', () => {
    it('can return false for null user', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canRegister(null);
      expect(result).toBeFalsy();
    });

    it('can return false for core user with null role', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canRegister({ isCore: true, roles: null } as User);
      expect(result).toBeFalsy();
    });

    it('can return false for core user without role', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canRegister({ isCore: true, roles: [] } as User);
      expect(result).toBeFalsy();
    });

    it('can return true for user with role', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canRegister({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User);
      expect(result).toBeTruthy();
    });

    it('can return false for user with wrong role', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);
      const result = entity.canRegister({
        isCore: true,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(result).toBeFalsy();
    });
  });

  describe('mergeUpdate', () => {
    it('can merge update with latest revision without schema', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      const result = entity.mergeUpdate({ a: '123' });

      expect(result).toMatchObject({ a: '123' });
    });

    it('can merge update with latest revision with array', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {
          items: ['items1', 'items2'],
        },
      });

      const result = entity.mergeUpdate({ items: ['item3'] });

      expect(result).toMatchObject({ items: ['items1', 'items2', 'item3'] });
    });

    it('can merge update with latest revision with array of objects', () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {
          sites: [
            { url: 'http://newsite.com', allowAnonymous: true, views: [] },
            { url: 'http://example.com', allowAnonymous: true, views: [] },
          ],
        },
      });

      const result = entity.mergeUpdate({ sites: [{ url: 'http://third.com', allowAnonymous: true, views: [] }] });

      expect(result).toMatchObject({
        sites: [
          { url: 'http://newsite.com', allowAnonymous: true, views: [] },
          { url: 'http://example.com', allowAnonymous: true, views: [] },
          { url: 'http://third.com', allowAnonymous: true, views: [] },
        ],
      });
    });

    it('can merge update with latest revision with schema', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        {
          revision: 2,
          configuration: { a: '321', b: '321' } as unknown,
        },
        tenantId,
        definition
      );

      const result = entity.mergeUpdate({ a: '123' });
      expect(result).toMatchObject({ a: '123', b: '321' });
    });

    it('can merge top level property', () => {
      const entity = new ConfigurationEntity(
        namespace,
        name,
        loggerMock,
        repositoryMock,
        validationMock,
        {
          revision: 2,
          configuration: { a: { b: '321' } } as unknown,
        },
        tenantId,
        definition
      );

      const result = entity.mergeUpdate({ a: { a: '123' } });
      expect(result).toMatchObject({ a: expect.objectContaining({ a: '123', b: '321' }) });
    });
  });

  describe('update', () => {
    it('can update first revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);

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
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
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
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      await expect(
        entity.update({ isCore: true, roles: [ConfigurationServiceRoles.ConfiguredService] } as User, null)
      ).rejects.toThrow(/Configuration must have a value./);
    });

    it('can throw for unauthorized user', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      await expect(entity.update({ id: 'test', name: 'test' } as User, {})).rejects.toThrow(
        /User test \(ID: test\) not permitted to modify configuration./
      );
    });

    it('can throw for invalid configuration', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
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
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);

      repositoryMock.saveRevision.mockImplementationOnce((_entity, rev) => rev);

      const updated = await entity.createRevision({
        isCore: true,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(updated.latest.revision).toBe(0);
      expect(updated.latest.configuration).toBeTruthy();
    });

    it('can create new revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: { value: 'value' } as unknown,
      });

      repositoryMock.saveRevision.mockImplementationOnce((_entity, rev) => rev);

      const updated = await entity.createRevision({
        isCore: true,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);
      expect(updated.latest.revision).toBe(3);
      expect(updated.latest.configuration['value']).toBe('value');
    });

    it('can throw for unauthorized user', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
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
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
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
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
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

  describe('getActiveRevision', () => {
    it('get active revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 1,
        configuration: {} as unknown,
      });

      const activeRevision = {};
      repositoryMock.getActiveRevision.mockResolvedValueOnce(activeRevision);

      const result = await entity.getActiveRevision();
      expect(result).toBe(activeRevision);
    });
  });

  describe('setActiveRevision', () => {
    it('sets active revision', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 1,
        configuration: {} as unknown,
      });
      const active = 2;

      const activeRevision = {};
      repositoryMock.setActiveRevision.mockImplementationOnce(() => {
        return activeRevision;
      });

      await entity.setActiveRevision(
        {
          isCore: true,
          roles: [ConfigurationServiceRoles.ConfigurationAdmin],
        } as User,
        active
      );
      const result = await entity.getActiveRevision();
      expect(result).toBe(activeRevision);
    });

    it('can throw for unauthorized user', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      const active = 2;

      await expect(entity.setActiveRevision({ id: 'test', name: 'test' } as User, active)).rejects.toThrow(
        /User test \(ID: test\) not permitted to modify configuration./
      );
    });
  });

  describe('delete', () => {
    it('can delete configuration', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock);

      repositoryMock.delete.mockResolvedValueOnce(true);

      const deleted = await entity.delete({
        isCore: false,
        tenantId,
        roles: [ConfigurationServiceRoles.ConfigurationAdmin],
      } as User);

      expect(deleted).toBe(true);
      expect(repositoryMock.delete).toHaveBeenCalledWith(entity);
    });

    it('can throw for unauthorized user', async () => {
      const entity = new ConfigurationEntity(namespace, name, loggerMock, repositoryMock, validationMock, {
        revision: 2,
        configuration: {} as unknown,
      });

      await expect(entity.delete({ id: 'test', name: 'test' } as User)).rejects.toThrow(
        /User test \(ID: test\) not permitted to delete configuration./
      );
    });
  });
});
