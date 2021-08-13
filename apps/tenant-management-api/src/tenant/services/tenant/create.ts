import { v4 as uuidv4 } from 'uuid';
import * as util from 'util';
import * as HttpStatusCodes from 'http-status-codes';
import { AdspId, ServiceRole } from '@abgov/adsp-service-sdk';
import { createkcAdminClient } from '../../../keycloak';
import { logger } from '../../../middleware/logger';
import { environment } from '../../../environments/environment';
import { FLOW_ALIAS, createAuthenticationFlow } from './createAuthenticationFlow';
import { TenantError } from './error';
import type ClientRepresentation from 'keycloak-admin/lib/defs/clientRepresentation';
import type RealmRepresentation from 'keycloak-admin/lib/defs/realmRepresentation';
import type RoleRepresentation from 'keycloak-admin/lib/defs/roleRepresentation';
import { tenantRepository } from '../../repository';
import { TenantEntity } from '../../models';
import { ServiceClient, ServiceRegistration } from '../../../configuration-management';
import { TenantServiceRoles } from '../../../roles';

export const tenantManagementRealm = 'core';

export const brokerClientName = (realm: string): string => {
  return `broker-${realm}`;
};

// TODO: Service bearer client and roles should be added when tenant activates service?
const createPlatformServiceConfig = (
  serviceId: AdspId,
  ...roles: ServiceRole[]
): { client: ClientRepresentation; clientRoles: RoleRepresentation[] } => {
  const client: ClientRepresentation = {
    id: uuidv4(),
    clientId: serviceId.toString(),
    description: `Bearer client containing roles for access to ${serviceId.service}`,
    bearerOnly: true,
    publicClient: false,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    standardFlowEnabled: false,
  };

  const clientRoles: RoleRepresentation[] = roles.map((r) => ({
    name: r.role,
    description: r.description,
  }));

  return {
    client,
    clientRoles,
  };
};

const createWebappClientConfig = (id: string): ClientRepresentation => {
  const config: ClientRepresentation = {
    id,
    clientId: environment.TENANT_WEB_APP_CLIENT_ID,
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: [`${environment.TENANT_WEB_APP_HOST}/*`],
    webOrigins: [environment.TENANT_WEB_APP_HOST],
    description: 'Client created by platform team to support the frontend. Please do not delete it',
  };

  return config;
};

const createTenantAdminComposite = async (
  registeredClients: ServiceClient[],
  realm: string,
  tenantAdminRole: RoleRepresentation
) => {
  const client = await createkcAdminClient();
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
      logger.debug(`Found ${registeredClient.serviceId} service client : ${serviceClient?.id}`);

      const adminRole = adminRoles[j];

      const serviceClientRole = await client.clients.findRole({
        realm,
        id: serviceClient.id,
        roleName: adminRole.role,
      });
      logger.debug(
        `Found ${registeredClient.serviceId} service client role ${adminRole?.role}: ${serviceClientRole.id}`
      );
      tenantAdminRoles.push(serviceClientRole);
    }
  }

  await client.roles.createComposite({ realm, roleId: tenantAdminRole.id }, tenantAdminRoles);
};

const createAdminUser = async (
  realm: string,
  email: string,
  tenantServiceClientId: string,
  tenantAdminRole: RoleRepresentation
) => {
  logger.info('Start to create admin user');
  const kcClient = await createkcAdminClient();
  const username = email;
  const adminUser = {
    id: uuidv4(),
    email: email,
    username: username,
    realm: realm,
    enabled: true,
  };
  const user = await kcClient.users.create(adminUser);
  // Add realm admin roles
  const realmManagementClient = (
    await kcClient.clients.find({
      clientId: 'realm-management',
      realm: realm,
    })
  )[0];

  const roles = await kcClient.clients.listRoles({
    id: realmManagementClient.id,
    realm: realm,
  });

  console.log(JSON.stringify(roles) + '<roles....');

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

  logger.info(`Add realm management roles to user: ${util.inspect(roleMapping)}`);
  await kcClient.users.addClientRoleMappings(roleMapping);

  await kcClient.users.addClientRoleMappings({
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

  await kcClient.users.listClientRoleMappings({ id: user.id, clientUniqueId: tenantServiceClientId });

  logger.info('Add tenant admin role to user.');

  logger.info('Created admin user');
};

const createIdpConfig = (secret, client, firstFlowAlias, realm) => {
  const authorizationUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/realms/core/protocol/openid-connect/auth`;
  const tokenUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/realms/core/protocol/openid-connect/token`;

  const config = {
    alias: 'core',
    providerId: 'keycloak-oidc',
    enabled: true,
    trustEmail: true,
    firstBrokerLoginFlowAlias: firstFlowAlias,
    displayName: 'GOA Single SignOn',
    storeToken: false,
    linkOnly: false,
    addReadTokenRoleOnCreate: false,
    realm: realm,
    config: {
      loginHint: 'true',
      clientId: client,
      tokenUrl: tokenUrl,
      authorizationUrl: authorizationUrl,
      clientAuthMethod: 'client_secret_basic',
      syncMode: 'IMPORT',
      clientSecret: secret,
      prompt: 'login',
      useJwksUrl: 'true',
    },
  };

  return config;
};

const createBrokerClientConfig = (
  realm: string,
  secret: string,
  client: string
): ClientRepresentation & { realm: string } => {
  const redirectUrl = `${environment.KEYCLOAK_ROOT_URL}/auth/realms/${realm}/broker/core/endpoint`;
  const config: ClientRepresentation & { realm: string } = {
    id: uuidv4(),
    clientId: client,
    description: `Client used to support the IdP of realm ${realm}`,
    secret: secret,
    redirectUris: [redirectUrl],
    realm: tenantManagementRealm,
    publicClient: false,
    authorizationServicesEnabled: false,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    standardFlowEnabled: true,
    serviceAccountsEnabled: true,
  };
  return config;
};

const createBrokerClient = async (realm, secret, brokerClient) => {
  const config = createBrokerClientConfig(realm, secret, brokerClient);
  const client = await createkcAdminClient();
  await client.clients.create(config);
};

export const validateEmailInDB = async (email: string): Promise<void> => {
  logger.info(`Validate - has user created tenant realm before?`);
  const isTenantAdmin = await tenantRepository.isTenantAdmin(email);

  if (isTenantAdmin) {
    const errorMessage = `${email} is the tenant admin in our record. One user can create only one realm.`;
    throw new TenantError(errorMessage, HttpStatusCodes.CONFLICT);
  }
};

export const validateRealmCreation = async (realm: string): Promise<void> => {
  // Re-init the keycloak client after realm creation
  logger.info(`Start to validate the tenant creation: ${realm}`);
  const kcClient = await createkcAdminClient();
  const brokerClient = await kcClient.clients.find({
    clientId: brokerClientName(realm),
    realm: tenantManagementRealm,
  });

  if (brokerClient.length === 0) {
    throw new TenantError('[Tenant][Creation] cannot find broker client', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }

  const newRealm = await kcClient.realms.findOne({
    realm: realm,
  });

  if (newRealm === null) {
    throw new TenantError('[Tenant][Creation] cannot find the tenant realm', HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};

export const isRealmExisted = async (realm: string): Promise<boolean> => {
  const client = await createkcAdminClient();
  const result = await client.realms.findOne({ realm });
  return result !== null;
};

export const createRealm = async (
  services: ServiceRegistration,
  realm: string,
  email: string,
  tenantName: string
): Promise<void> => {
  logger.info(`Start to create ${realm} realm`);
  try {
    const brokerClientSecret = uuidv4();
    const tenantPublicClientId = uuidv4();
    const brokerClient = brokerClientName(realm);
    logger.info(`Start to create IdP broker client on the core for ${realm} realm`);

    let client = await createkcAdminClient();
    await createBrokerClient(realm, brokerClientSecret, brokerClient);
    logger.info(`Created IdP broker client on the core realm for ${realm} realm`);

    const publicClientConfig = createWebappClientConfig(tenantPublicClientId);
    const idpConfig = createIdpConfig(brokerClientSecret, brokerClient, FLOW_ALIAS, realm);

    const registeredClients = await services.getServiceClients();
    console.log(JSON.stringify(registeredClients) + '<registeredClients');

    const clients = registeredClients.map((registeredClient) =>
      createPlatformServiceConfig(registeredClient.serviceId, ...registeredClient.roles)
    );

    const realmConfig: RealmRepresentation = {
      id: realm,
      realm: realm,
      displayName: tenantName,
      displayNameHtml: tenantName,
      loginTheme: 'ads-theme',
      accountTheme: 'ads-theme',
      clients: [publicClientConfig, ...clients.map((c) => c.client)],
      roles: {
        client: clients.reduce((cs, c) => ({ ...cs, [c.client.clientId]: c.clientRoles }), {}),
      },
      enabled: true,
    };

    logger.info(`New realm config: ${util.inspect(realmConfig)}`);

    await client.realms.create(realmConfig);

    // Find the tenant admin role
    client = await createkcAdminClient();
    const tenantServiceClient = (
      await client.clients.find({
        realm,
        clientId: 'urn:ads:platform:tenant-service',
      })
    )[0];
    logger.debug(`Found tenant service client: ${tenantServiceClient?.id}`);

    const tenantAdminRole = await client.clients.findRole({
      realm,
      id: tenantServiceClient.id,
      roleName: TenantServiceRoles.TenantAdmin,
    });
    logger.debug(`Found tenant service client admin role: ${tenantAdminRole?.id}`);

    await createTenantAdminComposite(registeredClients, realm, tenantAdminRole);
    logger.info(`Created tenant admin composite role.`);

    await createAuthenticationFlow(realm);

    client = await createkcAdminClient();

    // IdP shall be created after authentication flow
    await client.identityProviders.create(idpConfig);

    await createAdminUser(realm, email, tenantServiceClient.id, tenantAdminRole);

    validateRealmCreation(realm);
  } catch (err) {
    if (err instanceof TenantError) {
      throw err;
    } else {
      logger.error(err);
      throw new TenantError(err.message, HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
};

export const createNewTenantInDB = async (
  email: string,
  realmName: string,
  tenantName: string,
  tokenIssuer: string
): Promise<TenantEntity> => {
  tokenIssuer = tokenIssuer.replace('core', tenantName);
  const tenantEntity = new TenantEntity(tenantRepository, uuidv4(), realmName, email, tokenIssuer, tenantName);
  const tenant = await tenantEntity.save();
  return tenant;
};

export function testCreate(): boolean {
  return true;
}
