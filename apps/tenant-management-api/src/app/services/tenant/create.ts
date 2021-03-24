import { createkcAdminClient } from '../../../keycloak';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../middleware/logger';
import * as util from 'util';
import { TenantError } from './error';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../../models/tenant';
import * as UserModel from '../../models/user';
import { FLOW_ALIAS, createAuthentificationFlow } from './createAuthenticationFlow';

export const tenantManagementRealm = 'core';

export const brokerClientName = (realm) => {
  return `broker-${realm}`;
};

const createWebappClientConfig = (id) => {
  const config = {
    id: id,
    clientId: 'tenant-platform-webapp',
    publicClient: true,
    directAccessGrantsEnabled: false,
    redirectUris: ['https://tenant-management-webapp-core-services-dev.os99.gov.ab.ca/*', 'http://localhost:4200/*'],
    webOrigins: ['https://tenant-management-webapp-core-services-dev.os99.gov.ab.ca/*', 'http://localhost:4200/*'],
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

  const realmMangementClient = (
    await kcClient.clients.find({
      clientId: 'realm-management',
      realm: realm,
    })
  )[0];

  const roles = await kcClient.clients.listRoles({
    id: realmMangementClient.id,
    realm: realm,
  });

  const roleMapping = {
    realm: realm,
    id: user.id,
    clientUniqueId: realmMangementClient.id,
    roles: [],
  };

  for (const role of roles) {
    roleMapping.roles.push({
      id: role.id,
      name: role.name,
    });
  }

  logger.info(`Add roles to user: ${util.inspect(roleMapping)}`);
  await kcClient.users.addClientRoleMappings(roleMapping);
  logger.info('Created admin user');
};

const createIdpConfig = (secret, client, firstFlowAlias, realm) => {
  const authorizationUrl = `${process.env.KEYCLOAK_ROOT_URL}/auth/realms/core/protocol/openid-connect/auth`;
  const tokenUrl = `${process.env.KEYCLOAK_ROOT_URL}/auth/realms/core/protocol/openid-connect/token`;

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

const createBrokerClientConfig = (realm, secret, client) => {
  const redirectUrl = `${process.env.KEYCLOAK_ROOT_URL}/auth/realms/${realm}/broker/core/endpoint`;
  const config = {
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

export const validateEmailInDB = async (email) => {
  logger.info(`Start to validate email -${email} for tenant creation in database`);
  const result = await TenantModel.findTenantByEmail(email);
  if (result.success) {
    const errorMessage = `${email} already created ${result.tenant.name}. One user can create only one realm.`;
    throw new TenantError(errorMessage, HttpStatusCodes.BAD_REQUEST);
  }
  logger.info(`email - ${email} passed validation`);
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

export const createRealm = async (realm, email) => {
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

    const realmConfig = {
      id: realm,
      realm: realm,
      clients: [publicClientConfig],
      enabled: true,
    };

    logger.info(`New realm config: ${util.inspect(realmConfig)}`);

    await client.realms.create(realmConfig);

    await createAuthentificationFlow(realm);

    client = await createkcAdminClient();

    // IdP shall be created after authentification flow
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

export const createNewTenantInDB = async (username, email, realmName, tenantName, tokenIssuer) => {
  let userId = null;

  const fetchUserResponse = await UserModel.findUserByEmail(email);
  if (fetchUserResponse.success) {
    logger.info(`Found user in database, user info: ${util.inspect(fetchUserResponse)}`);
    userId = fetchUserResponse.user._id;
  } else {
    logger.info(`Cannot find ${email} in database and start to create a new entry`);
    const newAdminUser = {
      email: email,
      username: username,
    };
    const newUserResponse = await UserModel.create(newAdminUser);
    userId = newUserResponse.id;
  }

  const tenant = {
    name: tenantName,
    realm: realmName,
    createdBy: userId,
    adminEmail: email,
    tokenIssuer: tokenIssuer,
  };

  const createTenantResult = await TenantModel.create(tenant);

  if (!createTenantResult.success) {
    const errorMessage = `Cannot create new tenant ${util.inspect(tenant)} in database.`;
    throw new TenantError(errorMessage, HttpStatusCodes.INTERNAL_SERVER_ERROR);
  }
};
