import { InvalidOperationError } from '@core-services/core-common';
import type KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import type ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import type IdentityProviderRepresentation from '@keycloak/keycloak-admin-client/lib/defs/identityProviderRepresentation';
import type RealmRepresentation from '@keycloak/keycloak-admin-client/lib/defs/realmRepresentation';
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import axios from 'axios';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from 'winston';
import { RealmService, ServiceClient, Tenant, TenantServiceRoles } from '../tenant';
import {
  createApiAppPublicClientConfig,
  createNxAdspPublicClientConfig,
  createPlatformServiceConfig,
  createSubscriberAppPublicClientConfig,
  createWebappClientConfig,
} from './configuration';
import { IdentityProviderResponse } from './type';

const LOG_CONTEXT = { context: 'RealmService' };
export const DEFAULT_IDP_NAME = 'goa-ad';
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
    this.logger.debug(`Creating tenant admin aggregate role for realm '${realm}'...`, LOG_CONTEXT);

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
        this.logger.debug(`Found ${registeredClient.serviceId} service client : ${serviceClient?.id}`, LOG_CONTEXT);

        const adminRole = adminRoles[j];

        const serviceClientRole = await client.clients.findRole({
          realm,
          id: serviceClient.id,
          roleName: adminRole.role,
        });
        this.logger.debug(
          `Found ${registeredClient.serviceId} service client role ${adminRole?.role}: ${serviceClientRole.id}`,
          LOG_CONTEXT
        );
        tenantAdminRoles.push(serviceClientRole);
      }
    }

    await client.roles.createComposite({ realm, roleId: tenantAdminRole.id }, tenantAdminRoles);
    this.logger.info(`Created tenant admin composite role for realm '${realm}.`, LOG_CONTEXT);
  }

  private async createAdminUser(
    client: KeycloakAdminClient,
    realm: string,
    email: string,
    tenantServiceClientId: string,
    tenantAdminRole: RoleRepresentation
  ) {
    this.logger.info(`Creating admin user ${email} for realm '${realm}'...`, LOG_CONTEXT);
    const username = email;
    const adminUser = {
      id: uuidv4(),
      email: email,
      username: username,
      realm: realm,
      enabled: true,
    };
    const user = await client.users.create(adminUser);
    this.logger.debug(`Created realm admin user with ID: ${user.id}`, LOG_CONTEXT);

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
    this.logger.debug('Retrieved realm-management roles.', LOG_CONTEXT);

    const roleMapping = {
      realm: realm,
      id: user.id,
      clientUniqueId: realmManagementClient.id,
      roles: [],
    };

    for (const role of roles) {
      // Note: there appears to be some issue with accessing the composite realm-admin role from master realm client context.
      // Add all the roles except for roles that are not default granted to the master realm service account with create-realm role.
      if (role.name === 'realm-admin' || role.name === 'impersonation') {
        continue;
      }

      roleMapping.roles.push({
        id: role.id,
        name: role.name,
      });
    }

    this.logger.debug(`Adding realm management roles to user: ${util.inspect(roleMapping)}`, LOG_CONTEXT);
    await client.users.addClientRoleMappings(roleMapping);

    this.logger.debug(`Adding tenant admin role to user.`, LOG_CONTEXT);
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

    this.logger.info(`Created admin user ${email} for realm '${realm}'.`, LOG_CONTEXT);
  }

  private async createCoreIdentityProvider(
    client: KeycloakAdminClient,
    clientSecret: string,
    clientId: string,
    flowAlias: string,
    realm: string
  ): Promise<{ id: string }> {
    this.logger.debug(`Creating core identity provider for realm '${realm}...`, LOG_CONTEXT);

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
      displayName: 'GoA Single Sign-On',
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
        validateSignature: 'true',
        useJwksUrl: 'true',
        jwksUrl,
        pkceEnabled: 'true',
        pkceMethod: 'S256',
      },
    };

    const result = await client.identityProviders.create(config);
    this.logger.info(`Created core identity provider with client '${clientId}' for realm '${realm}.`, LOG_CONTEXT);

    return result;
  }

  private async createBrokerClient(
    client: KeycloakAdminClient,
    realm: string,
    secret: string,
    clientId: string
  ): Promise<{ id: string }> {
    this.logger.debug(`Creating IdP broker client in core realm for ${realm} realm...`, LOG_CONTEXT);

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
    const result = await client.clients.create(config);

    this.logger.info(`Created IdP broker client in core realm for ${realm} realm.`, LOG_CONTEXT);
    return result;
  }

  private async createAuthenticationFlow(client: KeycloakAdminClient, realm: string): Promise<string> {
    this.logger.debug(`Creating authentication flow to tenant public client for realm ${realm}...`, LOG_CONTEXT);

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

    this.logger.info(`Created authentication flow to tenant public client for realm ${realm}...`, LOG_CONTEXT);

    return authFlow.alias;
  }

  private async validateRealmCreation(client: KeycloakAdminClient, realm: string): Promise<void> {
    this.logger.debug(`Validating new tenant realm '${realm}'...`, LOG_CONTEXT);
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
    this.logger.info(
      `Validated new tenant realm '${realm}' and associated broker client '${clientName}'.`,
      LOG_CONTEXT
    );
  }

  async createRealm(serviceClients: ServiceClient[], { name, realm, adminEmail }: Omit<Tenant, 'id'>): Promise<void> {
    this.logger.info(`Creating realm '${realm}' for tenant '${name}'...`, LOG_CONTEXT);
    const brokerClientSecret = uuidv4();
    const tenantPublicClientId = uuidv4();
    const subscriberAppPublicClientId = uuidv4();
    const apiAppPublicClientId = uuidv4();
    const nxAdspPublicClientId = uuidv4();
    const brokerClient = this.brokerClientName(realm);

    let client = await this.createAdminClient();
    await this.createBrokerClient(client, realm, brokerClientSecret, brokerClient);

    this.logger.debug(`Creating realm '${realm}' with base configuration...`, LOG_CONTEXT);
    const publicClientConfig = createWebappClientConfig(tenantPublicClientId);
    const subscriberAppPublicClientConfig = createSubscriberAppPublicClientConfig(subscriberAppPublicClientId);
    const apiAppPublicClientConfig = createApiAppPublicClientConfig(apiAppPublicClientId);
    const nxAdspPublicClientConfig = createNxAdspPublicClientConfig(nxAdspPublicClientId);

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
      clients: [
        subscriberAppPublicClientConfig,
        publicClientConfig,
        apiAppPublicClientConfig,
        nxAdspPublicClientConfig,
        ...clients.map((c) => c.client),
      ],
      roles: {
        client: clients.reduce((cs, c) => ({ ...cs, [c.client.clientId]: c.clientRoles }), {}),
      },
      enabled: true,
    };

    this.logger.debug(`New realm configuration: ${util.inspect(realmConfig)}`, LOG_CONTEXT);

    await client.realms.create(realmConfig);
    this.logger.info(`Created realm '${realm}' with base configuration.`, LOG_CONTEXT);

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
    this.logger.debug(`Found tenant service client: ${tenantServiceClient?.id}`, LOG_CONTEXT);

    const tenantAdminRole = await client.clients.findRole({
      realm,
      id: tenantServiceClient.id,
      roleName: TenantServiceRoles.TenantAdmin,
    });
    this.logger.debug(`Found tenant service client admin role: ${tenantAdminRole?.id}`, LOG_CONTEXT);

    await this.createTenantAdminComposite(client, serviceClients, realm, tenantAdminRole);

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

  async findUserId(realm: string, email: string): Promise<string> {
    const client = await this.createAdminClient();
    const url = `${this.keycloakRootUrl}/auth/admin/realms/${realm}/users`;
    const headers = {
      Authorization: `Bearer ${client.accessToken}`,
    };

    try {
      const response = await axios.get(url, {
        headers,
        params: {
          email,
          exact: true,
        },
      });
      const users = response.data;
      if (users.length === 0) return null;

      return response.data[0].id;
    } catch (error) {
      const errMessage = `Failed to find user id by email ${email} in ${realm} due to ${error.message}`;
      this.logger.error(errMessage);
    }
  }

  async checkUserDefaultIdpInCore(userId: string): Promise<boolean> {
    const client = await this.createAdminClient();

    const fetchIdPUrl = `${this.keycloakRootUrl}/auth/admin/realms/core/users/${userId}/federated-identity`;
    const headers = {
      Authorization: `Bearer ${client.accessToken}`,
    };

    try {
      const { data } = await axios.get<IdentityProviderResponse>(fetchIdPUrl, { headers });
      const defaultIdp = data.find((idp) => idp.identityProvider === DEFAULT_IDP_NAME);
      return defaultIdp !== undefined;
    } catch (err) {
      const errMessage = `Failed to check the ${DEFAULT_IDP_NAME} IdP in core for user ${userId} due to ${err.message}`;
      this.logger.error(errMessage);
      throw new InvalidOperationError(errMessage);
    }
  }

  async deleteUserIdp(userId: string, realm, idpName = 'goa-ad') {
    const client = await this.createAdminClient();
    const deleteGoAIdPUrl = `${this.keycloakRootUrl}/auth/admin/realms/${realm}/users/${userId}/federated-identity/${idpName}`;
    const headers = {
      Authorization: `Bearer ${client.accessToken}`,
    };

    try {
      await axios.delete(deleteGoAIdPUrl, { headers });
    } catch (err) {
      const errMessage = `Failed to delete the IdP ${idpName} from user ${userId} due to ${err.message}`;
      this.logger.error(errMessage);
      throw new InvalidOperationError(errMessage);
    }
  }
}
