import { InvalidOperationError } from '@core-services/core-common';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import RealmRepresentation from '@keycloak/keycloak-admin-client/lib/defs/realmRepresentation';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import axios from 'axios';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { RealmService, ServiceClient, Tenant, TenantServiceRoles } from '../tenant';
import {
  createPlatformServiceConfig,
  createSubscriberAppPublicClientConfig,
  createWebappClientConfig,
} from './configuration';

export class KeycloakRealmServiceImpl implements RealmService {
  constructor(
    private logger: Logger,
    private keycloakRootUrl: string,
    private managementRealm: string,
    private createAdminClient: () => Promise<KeycloakAdminClient>
  ) {}

  private brokerClientName(realm: string): string {
    return `broker-${realm}`;
  }

  private async createTenantAdminComposite(
    client: KeycloakAdminClient,
    registeredClients: ServiceClient[],
    realm: string,
    tenantAdminRole: RoleRepresentation
  ) {
    // Unfortunately the keycloak client isn't very friendly around creating composite roles.
    // Find all the client roles that should be included as part of tenant admin.
    const tenantAdminRoles: RoleRepresentation[] = [];
    for (let i = 0; i < registeredClients.length; i++) {
      const registeredClient = registeredClients[i];
      const adminRoles = registeredClient.roles.filter((r) => r.inTenantAdmin);
      for (let j = 0; j < adminRoles.length; j++) {
        const serviceClient = (
          await client.clients.find({
            realm,
            clientId: registeredClient.serviceId.toString(),
          })
        )[0];
        this.logger.debug(`Found ${registeredClient.serviceId} service client : ${serviceClient?.id}`);

        const adminRole = adminRoles[j];

        const serviceClientRole = await client.clients.findRole({
          realm,
          id: serviceClient.id,
          roleName: adminRole.role,
        });
        this.logger.debug(
          `Found ${registeredClient.serviceId} service client role ${adminRole?.role}: ${serviceClientRole.id}`
        );
        tenantAdminRoles.push(serviceClientRole);
      }
    }

    await client.roles.createComposite({ realm, roleId: tenantAdminRole.id }, tenantAdminRoles);
  }

  private async createAdminUser(
    client: KeycloakAdminClient,
    realm: string,
    email: string,
    tenantServiceClientId: string,
    tenantAdminRole: RoleRepresentation
  ) {
    this.logger.info('Start to create admin user');
    const username = email;
    const adminUser = {
      id: uuidv4(),
      email: email,
      username: username,
      realm: realm,
      enabled: true,
    };
    const user = await client.users.create(adminUser);
    // Add realm admin roles
    const realmManagementClient = (
      await client.clients.find({
        clientId: 'realm-management',
        realm: realm,
      })
    )[0];

    const roles = await client.clients.listRoles({
      id: realmManagementClient.id,
      realm: realm,
    });

    const roleMapping = {
      realm: realm,
      id: user.id,
      clientUniqueId: realmManagementClient.id,
      roles: [],
    };

    for (const role of roles) {
      roleMapping.roles.push({
        id: role.id,
        name: role.name,
      });
    }

    this.logger.info(`Add realm management roles to user: ${util.inspect(roleMapping)}`);
    await client.users.addClientRoleMappings(roleMapping);

    await client.users.addClientRoleMappings({
      id: user.id,
      realm: realm,
      clientUniqueId: tenantServiceClientId,
      roles: [
        {
          id: tenantAdminRole.id,
          name: tenantAdminRole.name,
        },
      ],
    });

    this.logger.info('Add tenant admin role to user.');

    this.logger.info('Created admin user');
  }

  private async createCoreIdentityProvider(
    client: KeycloakAdminClient,
    clientSecret: string,
    clientId: string,
    flowAlias: string,
    realm: string
  ): Promise<{ id: string }> {
    const issuer = `${this.keycloakRootUrl}/auth/realms/core`;
    const authorizationUrl = `${this.keycloakRootUrl}/auth/realms/core/protocol/openid-connect/auth`;
    const tokenUrl = `${this.keycloakRootUrl}/auth/realms/core/protocol/openid-connect/token`;
    const logoutUrl = `${this.keycloakRootUrl}/auth/realms/core/protocol/openid-connect/logout`;
    const userInfoUrl = `${this.keycloakRootUrl}/auth/realms/core/protocol/openid-connect/userinfo`;
    const jwksUrl = `${this.keycloakRootUrl}/auth/realms/core/protocol/openid-connect/certs`;

    const config: IdentityProviderRepresentation & { realm: string } = {
      alias: 'core',
      providerId: 'keycloak-oidc',
      enabled: true,
      trustEmail: true,
      firstBrokerLoginFlowAlias: flowAlias,
      displayName: 'GOA Single SignOn',
      storeToken: false,
      linkOnly: false,
      addReadTokenRoleOnCreate: false,
      realm,
      config: {
        loginHint: 'true',
        clientId,
        clientSecret,
        issuer,
        tokenUrl,
        userInfoUrl,
        authorizationUrl,
        logoutUrl,
        clientAuthMethod: 'client_secret_basic',
        syncMode: 'IMPORT',
        backchannelSupported: 'true',
        validateSignature: 'true',
        useJwksUrl: 'true',
        jwksUrl,
        pkceEnabled: 'true',
        pkceMethod: 'S256',
      },
    };

    return await client.identityProviders.create(config);
  }

  private async createBrokerClient(client: KeycloakAdminClient, realm: string, secret: string, clientId: string) {
    const redirectUrl = `${this.keycloakRootUrl}/auth/realms/${realm}/broker/core/endpoint/*`;

    const config: ClientRepresentation & { realm: string } = {
      id: uuidv4(),
      clientId,
      description: `Client used to support the IdP of realm ${realm}`,
      secret,
      redirectUris: [redirectUrl],
      realm: this.managementRealm,
      publicClient: false,
      authorizationServicesEnabled: false,
      implicitFlowEnabled: false,
      directAccessGrantsEnabled: false,
      standardFlowEnabled: true,
      serviceAccountsEnabled: true,
    };
    await client.clients.create(config);
  }

  private async createAuthenticationFlow(client: KeycloakAdminClient, realm: string): Promise<string> {
    this.logger.debug('Adding authentication flow to tenant public client...');

    const flowAlias = 'GOA SSO Login Flow';
    const authFlow = {
      id: uuidv4(),
      alias: flowAlias,
      realm,
      description:
        'An authentication flow that allows GOA SSO as new keycloak account or link to existing (usually Admin) account.',
      providerId: 'basic-flow',
      topLevel: true,
      builtIn: false,
    };

    await client.authenticationManagement.createFlow(authFlow);

    // Have issue of creating executions with the authentication flow. Add executions separately...
    const executionUrl = `${this.keycloakRootUrl}/auth/admin/realms/${realm}/authentication/flows/${flowAlias}/executions/execution`;
    const executionsUrl = `${this.keycloakRootUrl}/auth/admin/realms/${realm}/authentication/flows/${flowAlias}/executions`;

    // Can we preset the id here?
    const userExecution = {
      provider: 'idp-create-user-if-unique',
    };

    const idpLinkExecution = {
      provider: 'idp-auto-link',
    };

    const headers = {
      Authorization: `Bearer ${client.accessToken}`,
      'Content-Type': 'application/json',
    };

    await axios.post(executionUrl, userExecution, { headers });
    await axios.post(executionUrl, idpLinkExecution, { headers });

    // Note: tried to add requirement: 'ALTERNATIVE' in creation, but it does not work.
    const { data: executions } = await axios.get(executionsUrl, { headers });

    for (const execution of executions) {
      const updatePayload = {
        id: execution.id,
        requirement: 'ALTERNATIVE',
      };
      await axios.put(executionsUrl, updatePayload, { headers });
    }

    this.logger.info('Added authentication flow to tenant public client.');

    return authFlow.alias;
  }

  private async validateRealmCreation(client: KeycloakAdminClient, realm: string): Promise<void> {
    // Re-init the keycloak client after realm creation
    this.logger.info(`Start to validate the tenant creation: ${realm}`);
    const clientName = this.brokerClientName(realm);
    const brokerClient = await client.clients.find({
      clientId: clientName,
      realm: this.managementRealm,
    });

    if (brokerClient.length === 0) {
      throw new InvalidOperationError(`Cannot find broker client: ${clientName}`);
    }

    const newRealm = await client.realms.findOne({
      realm: realm,
    });

    if (!newRealm) {
      throw new InvalidOperationError(`Cannot find the tenant realm: ${realm}`);
    }
  }

  async createRealm(serviceClients: ServiceClient[], { name, realm, adminEmail }: Omit<Tenant, 'id'>): Promise<void> {
    this.logger.info(`Starting create ${realm} realm...`);
    const brokerClientSecret = uuidv4();
    const tenantPublicClientId = uuidv4();
    const subscriberAppPublicClientId = uuidv4();
    const brokerClient = this.brokerClientName(realm);

    this.logger.info(`Starting to create IdP broker client on the core for ${realm} realm...`);

    let client = await this.createAdminClient();
    await this.createBrokerClient(client, realm, brokerClientSecret, brokerClient);

    this.logger.info(`Created IdP broker client on the core realm for ${realm} realm`);

    const publicClientConfig = createWebappClientConfig(tenantPublicClientId);
    const subscriberAppPublicClientConfig = createSubscriberAppPublicClientConfig(subscriberAppPublicClientId);

    const clients = serviceClients.map((registeredClient) =>
      createPlatformServiceConfig(registeredClient.serviceId, ...registeredClient.roles)
    );

    const realmConfig: RealmRepresentation = {
      id: realm,
      realm: realm,
      displayName: name,
      displayNameHtml: name,
      loginTheme: 'ads-theme',
      accountTheme: 'ads-theme',
      clients: [subscriberAppPublicClientConfig, publicClientConfig, ...clients.map((c) => c.client)],
      roles: {
        client: clients.reduce((cs, c) => ({ ...cs, [c.client.clientId]: c.clientRoles }), {}),
      },
      enabled: true,
    };

    this.logger.info(`New realm config: ${util.inspect(realmConfig)}`);

    await client.realms.create(realmConfig);

    // Re-authenticate the admin client. This is necessary because the original access token does not include access
    // to the new realm that was just created.
    client = await this.createAdminClient();

    // Find the tenant admin role
    const tenantServiceClient = (
      await client.clients.find({
        realm,
        clientId: 'urn:ads:platform:tenant-service',
      })
    )[0];
    this.logger.debug(`Found tenant service client: ${tenantServiceClient?.id}`);

    const tenantAdminRole = await client.clients.findRole({
      realm,
      id: tenantServiceClient.id,
      roleName: TenantServiceRoles.TenantAdmin,
    });
    this.logger.debug(`Found tenant service client admin role: ${tenantAdminRole?.id}`);

    await this.createTenantAdminComposite(client, serviceClients, realm, tenantAdminRole);
    this.logger.info(`Created tenant admin composite role.`);

    const flowAlias = await this.createAuthenticationFlow(client, realm);
    await this.createCoreIdentityProvider(client, brokerClientSecret, brokerClient, flowAlias, realm);
    await this.createAdminUser(client, realm, adminEmail, tenantServiceClient.id, tenantAdminRole);

    await this.validateRealmCreation(client, realm);
  }

  private async deleteKeycloakRealm(kcClient: KeycloakAdminClient, realm: string): Promise<boolean> {
    try {
      this.logger.info(`Start to delete keycloak realm ${realm}`);

      await kcClient.realms.del({
        realm: realm,
      });

      return true;
    } catch (err) {
      const errMessage = `Failed deleting the keycloak realm with error: ${err.message}`;
      this.logger.error(errMessage);
      return false;
    }
  }

  private async deleteKeycloakBrokerClient(kcClient: KeycloakAdminClient, realm: string): Promise<boolean> {
    try {
      this.logger.info(`Start to delete IdP client in core`);

      const clientsOnCore = await kcClient.clients.find({
        realm: 'core',
      });
      const brokerClient = clientsOnCore.find((client) => {
        return client.clientId === this.brokerClientName(realm);
      });

      // If broker client isn't found, that's ok... since end result is the same.
      if (brokerClient) {
        this.logger.info(brokerClient.id);
        await kcClient.clients.del({
          id: brokerClient.id,
          realm: 'core',
        });
      }

      return true;
    } catch (err) {
      const errMessage = `Failed deleting the IdP client with error: ${err.message}`;
      this.logger.error(errMessage);

      return false;
    }
  }

  async deleteRealm({ realm }: Tenant): Promise<boolean> {
    if (!realm) {
      throw new InvalidOperationError('Tenant realm not specified.');
    }

    const client = await this.createAdminClient();
    const brokerDeleted = await this.deleteKeycloakBrokerClient(client, realm);
    const realmDeleted = await this.deleteKeycloakRealm(client, realm);

    return brokerDeleted && realmDeleted;
  }
}
