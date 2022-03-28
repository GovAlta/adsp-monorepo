import { adspId } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, InvalidValueError } from '@core-services/core-common';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { TenantServiceRoles } from '../../../roles';
import * as keycloak from '../../../keycloak';
import { TenantRepository } from '../../repository';
import * as createAuthenticationFlow from './createAuthenticationFlow';
import { createNewTenantInDB, createRealm, validateEmailInDB, validateName } from './create';

jest.mock('../../../keycloak');
const keycloakMock = keycloak as jest.Mocked<typeof keycloak>;

jest.mock('./createAuthenticationFlow');
const createAuthenticationFlowMock = createAuthenticationFlow as jest.Mocked<typeof createAuthenticationFlow>;

describe('create', () => {
  const repositoryMock = {
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.save.mockReset();
    repositoryMock.find.mockReset();
  });

  describe('validateEmailInDB', () => {
    it('can pass for new tenant owner', async () => {
      const email = 'test-admin@gov.ab.ca';
      repositoryMock.find.mockResolvedValueOnce([]);
      await validateEmailInDB(repositoryMock as unknown as TenantRepository, email);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ adminEmailEquals: email }));
    });

    it('can throw for owner with existing tenant', async () => {
      const email = 'test-admin@gov.ab.ca';
      repositoryMock.find.mockResolvedValueOnce([{ adminEmail: email }]);
      await expect(validateEmailInDB(repositoryMock as unknown as TenantRepository, email)).rejects.toThrow(
        InvalidOperationError
      );
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ adminEmailEquals: email }));
    });
  });

  describe('validateName', () => {
    it('can validate name', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([]);
      await validateName(repositoryMock as unknown as TenantRepository, name);
      expect(repositoryMock.find).toHaveBeenCalledWith(expect.objectContaining({ nameEquals: name }));
    });

    it('can throw for duplicate name', async () => {
      const name = 'My tenant';
      repositoryMock.find.mockResolvedValueOnce([{ name }]);
      await expect(validateName(repositoryMock as unknown as TenantRepository, name)).rejects.toThrow(
        InvalidValueError
      );
    });

    it('can throw for invalid character in name', async () => {
      const name = 'My tenant!';
      repositoryMock.find.mockResolvedValueOnce([]);
      await expect(validateName(repositoryMock as unknown as TenantRepository, name)).rejects.toThrow(
        InvalidValueError
      );
    });

    it('can throw for empty name', async () => {
      const name = '';
      repositoryMock.find.mockResolvedValueOnce([]);
      await expect(validateName(repositoryMock as unknown as TenantRepository, name)).rejects.toThrow(
        InvalidValueError
      );
    });
  });

  describe('createNewTenantInDB', () => {
    it('can create tenant', async () => {
      const name = 'My tenant';
      const adminEmail = 'test-admin@gov.ab.ca';
      const realm = 'my-tenant-realm';
      repositoryMock.save.mockImplementationOnce((entity) => Promise.resolve(entity));
      const result = await createNewTenantInDB(repositoryMock as unknown as TenantRepository, adminEmail, realm, name);
      expect(result).toMatchObject({ name, adminEmail, realm });
      expect(repositoryMock.save).toHaveBeenCalledWith(expect.objectContaining({ name, adminEmail, realm }));
    });
  });

  describe('createRealm', () => {
    it('can create realm', async () => {
      const name = 'My tenant';
      const adminEmail = 'test-admin@gov.ab.ca';
      const realm = 'my-tenant-realm';
      const serviceRoles = {
        serviceId: adspId`urn:ads:platform:test-service`,
        roles: [{ role: 'tester', description: 'Tester role for testing.', inTenantAdmin: true }],
      };
      const keycloakClientMock = {
        realms: {
          create: jest.fn(),
          findOne: jest.fn(),
        },
        clients: {
          create: jest.fn(),
          find: jest.fn(),
          findRole: jest.fn(),
          listRoles: jest.fn(),
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
      const testerRole = { id: 'tester-role-123' };

      keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
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

      keycloakClientMock.realms.findOne.mockResolvedValueOnce({});

      await createRealm([serviceRoles], realm, adminEmail, name);

      // Expect two calls since after realm creation client needs to be re-authenticated to have permissions for new realm.
      expect(keycloakMock.createkcAdminClient).toHaveBeenCalledTimes(2);

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
      expect(createAuthenticationFlowMock.createAuthenticationFlow).toHaveBeenCalledWith(keycloakClientMock, realm);
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
      const keycloakClientMock = {
        realms: {
          create: jest.fn(),
          findOne: jest.fn(),
        },
        clients: {
          create: jest.fn(),
          find: jest.fn(),
          findRole: jest.fn(),
          listRoles: jest.fn(),
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
      const testerRole = { id: 'tester-role-123' };

      keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
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

      keycloakClientMock.realms.findOne.mockResolvedValueOnce({});

      await expect(createRealm([serviceRoles], realm, adminEmail, name)).rejects.toThrow(InvalidOperationError);
    });

    it('can throw for missing realm', async () => {
      const name = 'My tenant';
      const adminEmail = 'test-admin@gov.ab.ca';
      const realm = 'my-tenant-realm';
      const serviceRoles = {
        serviceId: adspId`urn:ads:platform:test-service`,
        roles: [{ role: 'tester', description: 'Tester role for testing.', inTenantAdmin: true }],
      };
      const keycloakClientMock = {
        realms: {
          create: jest.fn(),
          findOne: jest.fn(),
        },
        clients: {
          create: jest.fn(),
          find: jest.fn(),
          findRole: jest.fn(),
          listRoles: jest.fn(),
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
      const testerRole = { id: 'tester-role-123' };

      keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
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

      keycloakClientMock.realms.findOne.mockResolvedValueOnce(null);

      await expect(createRealm([serviceRoles], realm, adminEmail, name)).rejects.toThrow(InvalidOperationError);
    });
  });
});
