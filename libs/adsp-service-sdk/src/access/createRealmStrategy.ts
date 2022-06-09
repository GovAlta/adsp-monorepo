import { passportJwtSecret } from 'jwks-rsa';
import type { Strategy } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifyCallbackWithRequest } from 'passport-jwt';
import type { Logger } from 'winston';
import { Tenant, TenantService } from '../tenant';
import { AdspId, assertAdspId } from '../utils';
import { resolveRoles } from './resolveRoles';

export interface AccessStrategyOptions {
  realm: string;
  ignoreServiceAud?: boolean;
  serviceId: AdspId;
  tenantService: TenantService;
  accessServiceUrl: URL;
  logger: Logger;
}
export const createRealmStrategy = async ({
  realm,
  serviceId,
  tenantService,
  accessServiceUrl,
  ignoreServiceAud,
}: AccessStrategyOptions): Promise<Strategy> => {
  assertAdspId(serviceId, null, 'service');

  const serviceAud = serviceId.toString();
  const realmIssUrl = new URL(`/auth/realms/${realm}`, accessServiceUrl);
  const realmIss = realmIssUrl.href;
  const realmJwksUrl = new URL(`/auth/realms/${realm}/protocol/openid-connect/certs`, accessServiceUrl);
  const realmJwks = realmJwksUrl.href;

  const tenant: Tenant = realm !== 'core' ? await tenantService.getTenantByRealm(realm) : null;
  const verifyCallback: VerifyCallbackWithRequest = (req, payload, done) => {
    const user: Express.User = {
      id: payload.sub,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: resolveRoles(serviceAud, payload),
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
