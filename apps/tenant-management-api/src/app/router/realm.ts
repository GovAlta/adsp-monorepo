import { Router } from 'express';
import { IsDefined, IsOptional } from 'class-validator';
import { logger } from '../../middleware/logger';
import * as HttpStatusCodes from 'http-status-codes';
import * as TenantModel from '../services/tenant/model';
import validationMiddleware from '../../middleware/requestValidator';
import { createkcAdminClient } from '../../keycloak';
import { environment } from '../../environments/environment';

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

    if (!payload.tenantName) {
      tenantName = realmName;
    }

    try {
      const tenant = {
        name: tenantName,
        realm: realmName,
      };

      const createTenantResult = await TenantModel.create(tenant);

      if (!createTenantResult.success) {
        throw createTenantResult.errors;
      }

      logger.info('Starting create realm....');
      const realm = await kcAdminClient.realms.create({
        id: realmName,
        realm: realmName,
      });

      if (realm.realmName != realmName) {
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

      return res.status(HttpStatusCodes.OK).json(data);
    } catch (err) {
      logger.error(err);
      // The err might include token
      return res
        .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        .json({ error: 'Create Realm failed!' });
    }
  }
}

realmRouter.post('/', validationMiddleware(CreateRealmDto), createRealm);

export default realmRouter;
