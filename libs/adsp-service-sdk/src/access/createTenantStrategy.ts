import type { Strategy } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifyCallbackWithRequest } from 'passport-jwt';
import { TenantService } from '../tenant';
import { assertAdspId } from '../utils';
import { AccessStrategyOptions as BaseAccessStrategyOptions } from './createCoreStrategy';
import { IssuerCache } from './issuerCache';
import { TenantKeyProvider } from './keyProvider';

interface AccessStrategyOptions extends BaseAccessStrategyOptions {
  tenantService: TenantService;
}

export const createTenantStrategy = ({
  serviceId,
  tenantService,
  accessServiceUrl,
  ignoreServiceAud,
  logger,
}: AccessStrategyOptions): Strategy => {
  assertAdspId(serviceId, null, 'service');

  const serviceAud = serviceId.toString();
  const issuerCache = new IssuerCache(logger, accessServiceUrl, tenantService);
  const keyProvider = new TenantKeyProvider(logger, accessServiceUrl, issuerCache);

  const verifyCallback: VerifyCallbackWithRequest = async (req, payload, done) => {
    const tenant = await issuerCache.getTenantByIssuer(payload.iss);
    const user: Express.User = {
      id: payload.sub,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: [...payload.realm_access.roles, ...(payload.resource_access[serviceAud]?.roles || [])],
      tenantId: tenant?.id,
      isCore: false,
      token: {
        ...payload,
        bearer: req.headers.authorization?.substring(7),
      },
    };

    done(null, user, null);
  };

  const strategy = new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKeyProvider: keyProvider.keyRequestHandler,
      passReqToCallback: true,
      audience: !ignoreServiceAud ? serviceAud : null,
    },
    verifyCallback
  );

  return strategy;
};
