import { passportJwtSecret } from 'jwks-rsa';
import type { Strategy } from 'passport';
import { ExtractJwt, Strategy as JwtStrategy, VerifyCallbackWithRequest } from 'passport-jwt';
import type { Logger } from 'winston';
import { AdspId, assertAdspId } from '../utils';

export interface AccessStrategyOptions {
  ignoreServiceAud?: boolean;
  serviceId: AdspId;
  accessServiceUrl: URL;
  logger: Logger;
}

const CORE_ISS_PATH = '/auth/realms/core';
const CORE_JWKS_PATH = '/auth/realms/core/protocol/openid-connect/certs';

export const createCoreStrategy = ({
  serviceId,
  accessServiceUrl,
  ignoreServiceAud,
}: AccessStrategyOptions): Strategy => {
  assertAdspId(serviceId, null, 'service');

  const serviceAud = serviceId.toString();
  const coreIssUrl = new URL(CORE_ISS_PATH, accessServiceUrl);
  const coreIss = coreIssUrl.href;
  const coreJwksUrl = new URL(CORE_JWKS_PATH, accessServiceUrl);
  const coreJwks = coreJwksUrl.href;

  const verifyCallback: VerifyCallbackWithRequest = async (req, payload, done) => {
    const user: Express.User = {
      id: payload.sub,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: [...payload.realm_access.roles, ...(payload.resource_access[serviceAud]?.roles || [])],
      isCore: true,
      token: {
        ...payload,
        bearer: req.headers.authorization,
      },
    };

    done(null, user);
  };

  const strategy = new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKeyProvider: (req, token, done) => {
        passportJwtSecret({
          jwksUri: coreJwks,
          cache: true,
          strictSsl: true,
        })(req, token, done);
      },
      passReqToCallback: true,
      audience: !ignoreServiceAud ? serviceAud : null,
      issuer: coreIss
    },
    verifyCallback
  );

  return strategy;
};
