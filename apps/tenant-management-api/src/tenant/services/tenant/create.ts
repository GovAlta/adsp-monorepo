import { v4 as uuidv4 } from 'uuid';
import * as util from 'util';
import * as HttpStatusCodes from 'http-status-codes';
import { AdspId, adspId } from '@abgov/adsp-service-sdk';
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

export const tenantManagementRealm = 'core';

export const brokerClientName = (realm: string): string => {
  return `broker-${realm}`;
};

// TODO: Service bearer client and roles should be added when tenant activates service?
const createPlatformServiceConfig = (
  serviceId: AdspId,
  ...roles: string[]
): { client: ClientRepresentation; clientRoles: RoleRepresentation[] } => {
  const client: ClientRepresentation = {
    id: uuidv4(),
    clientId: `${serviceId}`,
    description: `Bearer client containing roles for access to ${serviceId.service}`,
    bearerOnly: true,
    publicClient: false,
    implicitFlowEnabled: false,
    directAccessGrantsEnabled: false,
    standardFlowEnabled: false,
  };

  const clientRoles: RoleRepresentation[] = roles.map((r) => ({
    name: r,
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

const createAdminUser = async (realm, email) => {
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

  // Add default service roles
  const defaultServiceRoles = ['file-service-admin'];

  const serviceRoles = [];

  for (const serviceRole of defaultServiceRoles) {
    await kcClient.roles.create({
      name: serviceRole,
      realm: realm,
    });

    const currentRole = await kcClient.roles.findOneByName({
      name: serviceRole,
      realm: realm,
    });
    serviceRoles.push({
      id: currentRole.id,
      name: currentRole.name,
    });
  }

  logger.info(`Add service roles to user: ${util.inspect(serviceRoles)}`);

  await kcClient.users.addRealmRoleMappings({
    id: user.id,
    realm: realm,
    roles: serviceRoles,
  });

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

export const validateRealmCreation = async (realm) => {
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

export const createRealm = async (realm: string, email: string, tenantName: string) => {
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

    const { client: tenantClient, clientRoles: tenantClientRoles } = createPlatformServiceConfig(
      adspId`urn:ads:platform:tenant-service`,
      'tenant-service-admin'
    );
    const { client: fileClient, clientRoles: fileClientRoles } = createPlatformServiceConfig(
      adspId`urn:ads:platform:file-service`,
      'file-service-admin'
    );

    const realmConfig: RealmRepresentation = {
      id: realm,
      realm: realm,
      displayName: tenantName,
      displayNameHtml: tenantName,
      loginTheme: 'ads-theme',
      clients: [publicClientConfig, tenantClient, fileClient],
      roles: {
        client: {
          [tenantClient.clientId]: tenantClientRoles,
          [fileClient.clientId]: fileClientRoles,
        },
      },
      enabled: true,
    };

    logger.info(`New realm config: ${util.inspect(realmConfig)}`);

    await client.realms.create(realmConfig);

    await createAuthenticationFlow(realm);

    client = await createkcAdminClient();

    // IdP shall be created after authentication flow
    await client.identityProviders.create(idpConfig);

    await createAdminUser(realm, email);

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
