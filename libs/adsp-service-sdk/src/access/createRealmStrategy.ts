import { passportJwtSecret } from 'jwks-rsa';
import type { Strategy } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifyCallbackWithRequest } from 'passport-jwt';
import type { Logger } from 'winston';
import { Tenant, TenantService } from '../tenant';
import { AdspId, assertAdspId } from '../utils';

export interface AccessStrategyOptions {
  realm: string;
  ignoreServiceAud?: boolean;
  serviceId: AdspId;
  tenantService: TenantService;
  accessServiceUrl: URL;
  logger: Logger;
}
export const createRealmStrategy = ({
  realm,
  serviceId,
  tenantService,
  accessServiceUrl,
  ignoreServiceAud,
}: AccessStrategyOptions): Strategy => {
  assertAdspId(serviceId, null, 'service');

  const serviceAud = serviceId.toString();
  const realmIssUrl = new URL(`/auth/realms/${realm}`, accessServiceUrl);
  const realmIss = realmIssUrl.href;
  const realmJwksUrl = new URL(`/auth/realms/${realm}`, accessServiceUrl);
  const realmJwks = realmJwksUrl.href;

  let tenant: Tenant = null;
  const verifyCallback: VerifyCallbackWithRequest = async (req, payload, done) => {
    if (!tenant && realm !== 'core') {
      tenant = await tenantService.getTenantByRealm(realm);
    }
    const user: Express.User = {
      id: payload.sub,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: [...(payload.realm_access?.roles || []), ...(payload.resource_access?.[serviceAud]?.roles || [])],
      tenantId: tenant?.id,
      isCore: realm === 'core',
      token: {
        ...payload,
        bearer: req.headers.authorization?.substring(7),
      },
    };

    done(null, user);
  };

  const strategy = new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKeyProvider: (req, token, done) => {
        passportJwtSecret({
          jwksUri: realmJwks,
          cache: true,
          strictSsl: true,
        })(req, token, done);
      },
      passReqToCallback: true,
      audience: !ignoreServiceAud ? serviceAud : null,
      issuer: realmIss,
    },
    verifyCallback
  );

  return strategy;
};
