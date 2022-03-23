import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import * as keycloak from '../../../keycloak';
import { TenantRepository } from '../../repository';
import { deleteTenant } from './delete';

jest.mock('../../../keycloak');
const keycloakMock = keycloak as jest.Mocked<typeof keycloak>;

describe('deleteTenant', () => {
  const repositoryMock = {
    delete: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.delete.mockReset();
  });

  it('can delete tenant', async () => {
    const realm = 'my-realm';
    const brokerClientId = `broker-${realm}`;
    const keycloakClientMock = {
      realms: {
        del: jest.fn(),
      },
      clients: {
        find: jest.fn(),
        del: jest.fn(),
      },
    };
    keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
    keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);
    const result = await deleteTenant(repositoryMock as unknown as TenantRepository, realm);
    expect(result).toMatchObject({
      keycloakRealm: expect.objectContaining({ isDeleted: true }),
      IdPBrokerClient: expect.objectContaining({ isDeleted: true }),
      db: expect.objectContaining({ isDeleted: true }),
    });
    expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm }));
    expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
    expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
      expect.objectContaining({ realm: 'core', id: 'broker-123' })
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith(realm);
  });

  it('can handle realm delete error', async () => {
    const realm = 'my-realm';
    const brokerClientId = `broker-${realm}`;
    const keycloakClientMock = {
      realms: {
        del: jest.fn(),
      },
      clients: {
        find: jest.fn(),
        del: jest.fn(),
      },
    };
    keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
    keycloakClientMock.realms.del.mockRejectedValueOnce(new Error('oh noes!'));
    keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);
    const result = await deleteTenant(repositoryMock as unknown as TenantRepository, realm);
    expect(result).toMatchObject({
      keycloakRealm: expect.objectContaining({ isDeleted: false, errors: expect.any(Array) }),
      IdPBrokerClient: expect.objectContaining({ isDeleted: true }),
      db: expect.objectContaining({ isDeleted: true }),
    });
    expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm }));
    expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
    expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
      expect.objectContaining({ realm: 'core', id: 'broker-123' })
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith(realm);
  });

  it('can handle broker client delete error', async () => {
    const realm = 'my-realm';
    const brokerClientId = `broker-${realm}`;
    const keycloakClientMock = {
      realms: {
        del: jest.fn(),
      },
      clients: {
        find: jest.fn(),
        del: jest.fn(),
      },
    };
    keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
    keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);
    keycloakClientMock.clients.del.mockRejectedValueOnce(new Error('oh noes!'));
    const result = await deleteTenant(repositoryMock as unknown as TenantRepository, realm);
    expect(result).toMatchObject({
      keycloakRealm: expect.objectContaining({ isDeleted: true }),
      IdPBrokerClient: expect.objectContaining({ isDeleted: false, errors: expect.any(Array) }),
      db: expect.objectContaining({ isDeleted: true }),
    });
    expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm }));
    expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
    expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
      expect.objectContaining({ realm: 'core', id: 'broker-123' })
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith(realm);
  });

  it('can handle broker client not found', async () => {
    const realm = 'my-realm';
    const keycloakClientMock = {
      realms: {
        del: jest.fn(),
      },
      clients: {
        find: jest.fn(),
        del: jest.fn(),
      },
    };
    keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
    keycloakClientMock.clients.find.mockResolvedValueOnce([]);
    const result = await deleteTenant(repositoryMock as unknown as TenantRepository, realm);
    expect(result).toMatchObject({
      keycloakRealm: expect.objectContaining({ isDeleted: true }),
      IdPBrokerClient: expect.objectContaining({ isDeleted: true }),
      db: expect.objectContaining({ isDeleted: true }),
    });
    expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm }));
    expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
    expect(keycloakClientMock.clients.del).not.toHaveBeenCalled();
    expect(repositoryMock.delete).toHaveBeenCalledWith(realm);
  });

  it('can handle tenant delete error', async () => {
    const realm = 'my-realm';
    const brokerClientId = `broker-${realm}`;
    const keycloakClientMock = {
      realms: {
        del: jest.fn(),
      },
      clients: {
        find: jest.fn(),
        del: jest.fn(),
      },
    };
    keycloakMock.createkcAdminClient.mockResolvedValue(keycloakClientMock as unknown as KeycloakAdminClient);
    keycloakClientMock.clients.find.mockResolvedValueOnce([{ id: 'broker-123', clientId: brokerClientId }]);
    repositoryMock.delete.mockRejectedValueOnce(new Error('oh noes!'));
    const result = await deleteTenant(repositoryMock as unknown as TenantRepository, realm);
    expect(result).toMatchObject({
      keycloakRealm: expect.objectContaining({ isDeleted: true }),
      IdPBrokerClient: expect.objectContaining({ isDeleted: true }),
      db: expect.objectContaining({ isDeleted: false, errors: expect.any(Array) }),
    });
    expect(keycloakClientMock.realms.del).toHaveBeenCalledWith(expect.objectContaining({ realm }));
    expect(keycloakClientMock.clients.find).toHaveBeenCalledWith(expect.objectContaining({ realm: 'core' }));
    expect(keycloakClientMock.clients.del).toHaveBeenCalledWith(
      expect.objectContaining({ realm: 'core', id: 'broker-123' })
    );
    expect(repositoryMock.delete).toHaveBeenCalledWith(realm);
  });
});
