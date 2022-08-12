import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import axios from 'axios';
import { Logger } from 'winston';
import { Tenant, TenantServiceRoles } from '../tenant';
import { KeycloakRealmServiceImpl } from './keycloak';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('KeycloakRealmService', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const keycloakClientMock = {
    accessToken: '123',
    authenticationManagement: {
      createFlow: jest.fn(),
    },
    realms: {
      create: jest.fn(),
      findOne: jest.fn(),
      del: jest.fn(),
    },
    clients: {
      create: jest.fn(),
      find: jest.fn(),
      findRole: jest.fn(),
      listRoles: jest.fn(),
      del: jest.fn(),
    },
    roles: {
      createComposite: jest.fn(),
    },
    identityProviders: {
      create: jest.fn(),
    },
    users: {
      create: jest.fn(),
      addClientRoleMappings: jest.fn(),
    },
  };

  const tenant: Tenant = {
    id: 'test',
    name: 'Test',
    adminEmail: 'tester@test.co',
    realm: 'test-realm',
  };

  const brokerClientId = `broker-${tenant.realm}`;

  beforeEach(() => {
    axiosMock.get.mockReset();

    // Create
    keycloakClientMock.realms.findOne.mockReset();
    keycloakClientMock.realms.create.mockReset();

    keycloakClientMock.clients.create.mockReset();
    keycloakClientMock.clients.find.mockReset();
    keycloakClientMock.clients.findRole.mockReset();
    keycloakClientMock.clients.listRoles.mockReset();

    keycloakClientMock.users.create.mockReset();
    keycloakClientMock.users.addClientRoleMappings.mockReset();

    keycloakClientMock.roles.createComposite.mockReset();
    keycloakClientMock.identityProviders.create.mockReset();
    keycloakClientMock.authenticationManagement.createFlow.mockReset();

    // Delete
    keycloakClientMock.realms.del.mockReset();
    keycloakClientMock.clients.find.mockReset();
    keycloakClientMock.clients.del.mockReset();
  });

  it('can be created', () => {
    const service = new KeycloakRealmServiceImpl(loggerMock, 'https://access-service', 'core', () =>
      Promise.resolve(keycloakClientMock as unknown as KeycloakAdminClient)
    );
    expect(service).toBeTruthy();
  });

  describe('deleteRealm', () => {
    const service = new KeycloakRealmServiceImpl(loggerMock, 'https://access-service', 'core', () =>
      Promise.resolve(keycloakClientMock as unknown as KeycloakAdminClient)
    );

    it('can delete realm', async () => {
      keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);

      const deleted = await service.deleteRealm(tenant);
      expect(deleted).toBeTruthy();

      expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
      expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
        expect.objectContaining({ realm: 'core', id: 'broker-123' })
      );
    });

    it('can throw for no realm', async () => {
      await expect(service.deleteRealm({ ...tenant, realm: null })).rejects.toThrow(InvalidOperationError);
    });

    it('can return false for delete realm error', async () => {
      keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);
      keycloakClientMock.realms.del.mockRejectedValueOnce(new Error('oh noes!'));

      const deleted = await service.deleteRealm(tenant);
      expect(deleted).toBeFalsy();

      expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
      expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
        expect.objectContaining({ realm: 'core', id: 'broker-123' })
      );
    });

    it('can handle broker client delete error', async () => {
      keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);
      keycloakClientMock.clients.del.mockRejectedValueOnce(new Error('oh noes!'));

      const deleted = await service.deleteRealm(tenant);
      expect(deleted).toBeFalsy();

      expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
      expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
        expect.objectContaining({ realm: 'core', id: 'broker-123' })
      );
    });

    it('can handle broker client not found', async () => {
      keycloakClientMock.clients.find.mockResolvedValueOnce([]);

      const deleted = await service.deleteRealm(tenant);
      expect(deleted).toBeTruthy();

      expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm: tenant.realm }));
      expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
      expect(keycloakClientMock.clients.del).not.toHaveBeenCalled();
    });
  });

  describe('createRealm', () => {
    const createkcAdminClient = jest.fn(() => Promise.resolve(keycloakClientMock as unknown as KeycloakAdminClient));
    const service = new KeycloakRealmServiceImpl(loggerMock, 'https://access-service', 'core', createkcAdminClient);

    it('can create realm', async () => {
      const name = 'My tenant';
      const adminEmail = 'test-admin@gov.ab.ca';
      const realm = 'my-tenant-realm';
      const serviceRoles = {
        serviceId: adspId`urn:ads:platform:test-service`,
        roles: [{ role: 'tester', description: 'Tester role for testing.', inTenantAdmin: true }],
      };

      const testerRole = { id: 'tester-role-123' };

      keycloakClientMock.clients.find
        .mockResolvedValueOnce([{ id: 'tenant-service-client-123' }])
        .mockResolvedValueOnce([{ id: 'test-service-client-123' }])
        .mockResolvedValueOnce([{ id: 'realm-management-client-123' }])
        .mockResolvedValueOnce([{ id: 'my-tenant-broker-client-123' }]);
      keycloakClientMock.clients.findRole
        .mockResolvedValueOnce({ id: 'tenant-admin-role-123', name: 'tenant-admin' })
        .mockResolvedValueOnce(testerRole);

      keycloakClientMock.users.create.mockResolvedValueOnce({ id: 'admin-user-123' });
      keycloakClientMock.clients.listRoles.mockResolvedValueOnce([{ id: 'realm-admin-role-123', name: 'realm-admin' }]);

      axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'execution-123' }] });

      keycloakClientMock.realms.findOne.mockResolvedValueOnce({});

      await service.createRealm([serviceRoles], { realm, adminEmail, name });

      // Expect two calls since after realm creation client needs to be re-authenticated to have permissions for new realm.
      expect(createkcAdminClient).toHaveBeenCalledTimes(2);

      expect(keycloakClientMock.clients.create).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
      expect(keycloakClientMock.realms.create).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: name, displayNameHtml: name })
      );
      expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 'urn:ads:platform:tenant-service' })
      );
      expect(keycloakClientMock.clients.findRole).toHaveBeenCalledWith(
        expect.objectContaining({ id: `tenant-service-client-123`, roleName: TenantServiceRoles.TenantAdmin })
      );
      expect(keycloakClientMock.roles.createComposite).toHaveBeenCalledWith(
        expect.objectContaining({ roleId: 'tenant-admin-role-123' }),
        expect.arrayContaining([testerRole])
      );

      axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'execution-123' }] });

      expect(keycloakClientMock.authenticationManagement.createFlow).toHaveBeenCalledWith(
        expect.objectContaining({ realm, topLevel: true, builtIn: false })
      );
      expect(axios.post).toHaveBeenCalledTimes(2);
      expect(axios.put).toHaveBeenCalledTimes(1);

      expect(keycloakClientMock.identityProviders.create).toHaveBeenCalledWith(
        expect.objectContaining({ alias: 'core' })
      );
      expect(keycloakClientMock.users.create).toHaveBeenCalledWith(expect.objectContaining({ email: adminEmail }));
      expect(keycloakClientMock.clients.listRoles).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'realm-management-client-123' })
      );
      expect(keycloakClientMock.users.addClientRoleMappings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'admin-user-123',
          realm,
          roles: expect.arrayContaining([expect.objectContaining({ id: 'realm-admin-role-123' })]),
        })
      );
      expect(keycloakClientMock.users.addClientRoleMappings).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'admin-user-123',
          realm,
          roles: expect.arrayContaining([
            expect.objectContaining({ id: 'tenant-admin-role-123', name: 'tenant-admin' }),
          ]),
        })
      );
      expect(keycloakClientMock.realms.findOne).toHaveBeenCalledWith(expect.objectContaining({ realm }));
    });

    it('can throw for missing broker client', async () => {
      const name = 'My tenant';
      const adminEmail = 'test-admin@gov.ab.ca';
      const realm = 'my-tenant-realm';
      const serviceRoles = {
        serviceId: adspId`urn:ads:platform:test-service`,
        roles: [{ role: 'tester', description: 'Tester role for testing.', inTenantAdmin: true }],
      };

      const testerRole = { id: 'tester-role-123' };

      keycloakClientMock.clients.find
        .mockResolvedValueOnce([{ id: 'tenant-service-client-123' }])
        .mockResolvedValueOnce([{ id: 'test-service-client-123' }])
        .mockResolvedValueOnce([{ id: 'realm-management-client-123' }])
        .mockResolvedValueOnce([]);
      keycloakClientMock.clients.findRole
        .mockResolvedValueOnce({ id: 'tenant-admin-role-123', name: 'tenant-admin' })
        .mockResolvedValueOnce(testerRole);

      keycloakClientMock.users.create.mockResolvedValueOnce({ id: 'admin-user-123' });
      keycloakClientMock.clients.listRoles.mockResolvedValueOnce([{ id: 'realm-admin-role-123', name: 'realm-admin' }]);

      axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'execution-123' }] });

      keycloakClientMock.realms.findOne.mockResolvedValueOnce({});

      await expect(service.createRealm([serviceRoles], { realm, adminEmail, name })).rejects.toThrow(
        InvalidOperationError
      );
    });

    it('can throw for missing realm', async () => {
      const name = 'My tenant';
      const adminEmail = 'test-admin@gov.ab.ca';
      const realm = 'my-tenant-realm';
      const serviceRoles = {
        serviceId: adspId`urn:ads:platform:test-service`,
        roles: [{ role: 'tester', description: 'Tester role for testing.', inTenantAdmin: true }],
      };

      const testerRole = { id: 'tester-role-123' };

      keycloakClientMock.clients.find
        .mockResolvedValueOnce([{ id: 'tenant-service-client-123' }])
        .mockResolvedValueOnce([{ id: 'test-service-client-123' }])
        .mockResolvedValueOnce([{ id: 'realm-management-client-123' }])
        .mockResolvedValueOnce([{ id: 'my-tenant-broker-client-123' }]);
      keycloakClientMock.clients.findRole
        .mockResolvedValueOnce({ id: 'tenant-admin-role-123', name: 'tenant-admin' })
        .mockResolvedValueOnce(testerRole);

      keycloakClientMock.users.create.mockResolvedValueOnce({ id: 'admin-user-123' });
      keycloakClientMock.clients.listRoles.mockResolvedValueOnce([{ id: 'realm-admin-role-123', name: 'realm-admin' }]);

      axiosMock.get.mockResolvedValueOnce({ data: [{ id: 'execution-123' }] });

      keycloakClientMock.realms.findOne.mockResolvedValueOnce(null);

      await expect(service.createRealm([serviceRoles], { realm, adminEmail, name })).rejects.toThrow(
        InvalidOperationError
      );
    });
  });
});
