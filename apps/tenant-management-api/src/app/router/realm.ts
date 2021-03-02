import { Router } from 'express';
import { IsDefined, IsOptional } from 'class-validator';
import { logger } from '../../middleware/logger';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../models/tenant';
import validationMiddleware from '../../middleware/requestValidator';
import { createkcAdminClient } from '../../keycloak';
import { environment } from '../../environments/environment';
import * as UserModel from '../models/user';

const realmRouter = Router();
class CreateRealmDto {
  @IsOptional()
  readonly tenantName = null;
  @IsDefined()
  realm: string;
}

async function createRealm(req, res) {
  {
    const kcAdminClient = await createkcAdminClient();

    const data = { status: 'ok', message: 'Create Realm Success!' };
    const payload = req.payload;
    const realmName = payload.realm;
    let tenantName = realmName;
    const email = req.user.email;
    const username = req.user.name;

    if (!payload.tenantName) {
      tenantName = realmName;
    }

    try {
      logger.info('Starting create realm....');
      const realmResponse = await kcAdminClient.realms.create({
        id: realmName,
        realm: realmName,
        enabled: true,
      });

      if (realmResponse.realmName != realmName) {
        return res
          .status(HttpStatusCodes.BAD_REQUEST)
          .json({ error: 'Create Realm failed!' });
      }

      logger.info('Starting create IdentityProvider...');
      const idp = await kcAdminClient.identityProviders.create({
        realm: realmName,
        alias: 'core',
        providerId: 'keycloak-oidc',
        enabled: true,
        trustEmail: true,
        firstBrokerLoginFlowAlias: 'first broker login',
        displayName: 'GOA Single SignOn',
        storeToken: false,
        linkOnly: false,
        addReadTokenRoleOnCreate: false,
        config: {
          loginHint: 'true',
          clientId: 'broker',
          tokenUrl:
            environment.KEYCLOAK_CORE_TOKEN_URL ||
            process.env.KEYCLOAK_CORE_TOKEN_URL,
          authorizationUrl:
            environment.KEYCLOAK_CORE_AUTH_URL ||
            process.env.KEYCLOAK_CORE_AUTH_URL,
          clientAuthMethod: 'client_secret_basic',
          syncMode: 'IMPORT',
          clientSecret:
            environment.KEYCLOAK_CORE_CLIENT_SECRET ||
            process.env.KEYCLOAK_CORE_CLIENT_SECRET,
          prompt: 'login',
          useJwksUrl: 'true',
        },
      });

      const brokerClient = await kcAdminClient.clients.findOne({
        id:
          environment.KEYCLOAK_CORE_BROKER_CLIENT_ID ||
          process.env.KEYCLOAK_CORE_BROKER_CLIENT_ID,
        realm: environment.KEYCLOAK_REALM || process.env.KEYCLOAK_REALM,
      });

      logger.info('Starting add redirectURI to broker...');
      const updatedBroker = await kcAdminClient.clients.update(
        {
          id:
            environment.KEYCLOAK_CORE_BROKER_CLIENT_ID ||
            process.env.KEYCLOAK_CORE_BROKER_CLIENT_ID,
          realm: environment.KEYCLOAK_REALM || process.env.KEYCLOAK_REALM,
        },
        {
          redirectUris: brokerClient.redirectUris.concat(
            (environment.KEYCLOAK_ROOT_URL || process.env.KEYCLOAK_ROOT_URL) +
              '/auth/realms/' +
              realmName +
              '/broker/core/endpoint'
          ),
        }
      );

      // Update the tenancy database
      const fetchUserResponse = await UserModel.findUserByEmail(email);
      let userId = null;

      if (fetchUserResponse.success) {
        logger.info('Find user in the database');
        console.log(fetchUserResponse);
        userId = fetchUserResponse.user._id;
      } else {
        logger.info('Cannot find user in the database, and create new use');
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
      };

      const createTenantResult = await TenantModel.create(tenant);

      if (!createTenantResult.success) {
        throw createTenantResult.errors;
      }

      return res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      logger.error(err.message);
      // The err might include token
      return res.status(err.response.status).json({ error: err.message });
    }
  }
}

async function deleteRealm(req, res) {
  const kcAdminClient = await createkcAdminClient();
  const data = { status: 'ok', message: 'Delete Realm Success!' };
  const payload = req.payload;
  const realmName = payload.realm;

  try {
    logger.info('Starting delete realm....');
    const realmResponse = await kcAdminClient.realms.del({
      realm: realmName,
    });
    return res.status(HttpStatusCodes.OK).json(data);
  } catch (err) {
    logger.error(err.message);
    return res.status(err.response.status).json({ error: err.message });
  }
}

realmRouter.post('/', validationMiddleware(CreateRealmDto), createRealm);

realmRouter.delete('/', validationMiddleware(CreateRealmDto), deleteRealm);

export default realmRouter;
