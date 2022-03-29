import type { Strategy } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifyCallbackWithRequest } from 'passport-jwt';
import { assertAdspId } from '../utils';
import { AccessStrategyOptions as BaseAccessStrategyOptions } from './createRealmStrategy';
import { IssuerCache } from './issuerCache';
import { TenantKeyProvider } from './keyProvider';

interface AccessStrategyOptions extends Omit<BaseAccessStrategyOptions, 'realm'> {
  accessTokenInQuery?: boolean;
}

export const createTenantStrategy = ({
  serviceId,
  tenantService,
  accessServiceUrl,
  ignoreServiceAud,
  accessTokenInQuery,
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
      roles: [...(payload.realm_access?.roles || []), ...(payload.resource_access?.[serviceAud]?.roles || [])],
      tenantId: tenant?.id,
      isCore: false,
      token: {
        ...payload,
        bearer: req.headers.authorization?.substring(7),
      },
    };

    done(null, user, null);
  };

  const extractors = [ExtractJwt.fromAuthHeaderAsBearerToken()];
  if (accessTokenInQuery) {
    extractors.push(ExtractJwt.fromUrlQueryParameter('token'));
  }

  const strategy = new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors(extractors),
      secretOrKeyProvider: keyProvider.keyRequestHandler,
      passReqToCallback: true,
      audience: !ignoreServiceAud ? serviceAud : null,
    },
    verifyCallback
  );

  return strategy;
};
