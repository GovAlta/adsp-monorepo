import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as Logging from './logging';
import jwtDecode from 'jwt-decode';
import * as jwksRsa from 'jwks-rsa';
import * as serviceInit from './serviceInit';
import { validateIssuer, updateCache, getTenantName } from './keycloakCache';

serviceInit.initService();

const createJwkClient = (jwksRsa as unknown) as (options: jwksRsa.ClientOptions) => jwksRsa.JwksClient;

// Must set default Issuer appropriately. Otherwise,the code will in an infinite loop
const logger = Logging.createLogger('[Auth][JWT]', 'info');

interface JWkClientConfig {
  timeout: number;
  requestHeader: jwksRsa.Headers;
  allowedIssuer: string;
  cacheMaxEntries: number;
  cacheMaxAge: number;
  cache: boolean;
  strictSsl: boolean;
}

const JWK_CLIENT_CONFIG: JWkClientConfig = {
  timeout: 30000,
  requestHeader: {},
  allowedIssuer: process.env.KEYCLOAK_ISSUER || 'https://access-dev.os99.gov.ab.ca/auth/realms',
  cacheMaxEntries: 100,
  cacheMaxAge: 3600000,
  cache: true,
  strictSsl: true,
};

export interface TokenRequestProps {
  url: string;
  clientId: string;
  clientSecret: string;
}

export const getKeycloakTokenRequestProps = ({
  KEYCLOAK_ROOT_URL,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
}): TokenRequestProps => ({
  url: `${KEYCLOAK_ROOT_URL}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
  clientId: KEYCLOAK_CLIENT_ID,
  clientSecret: KEYCLOAK_CLIENT_SECRET,
});

const authKeyCloakAdmin = (issuer, kid, done) => {
  const jwksUri = issuer + '/protocol/openid-connect/certs';
  const client = createJwkClient({
    jwksUri: jwksUri,
    ...JWK_CLIENT_CONFIG,
  });

  client.getSigningKey(kid, (err, key: jwksRsa.SigningKey) => {
    const signingKey = (key as jwksRsa.CertSigningKey)?.publicKey || (key as jwksRsa.RsaSigningKey)?.rsaPublicKey;

    if (signingKey !== null) {
      done(null, signingKey);
    } else {
      logger.error(err);
      done(null, null);
    }
  });
};

const kcKeyProvider = (req, rawJwtToken, done) => {
  let payload;
  let header;
  try {
    payload = jwtDecode(rawJwtToken);
    header = jwtDecode(rawJwtToken, { header: true });
  } catch (err) {
    done(null, null);
    logger.error(`Error decoding token ${err}`);
  }

  try {
    if (!payload) {
      return done(null, null);
    }
    const issuer = payload.iss;
    const kid = header.kid;
    if (!validateIssuer(issuer)) {
      updateCache().then(() => {
        if (validateIssuer(issuer)) {
          if (typeof getTenantName(issuer) === 'undefined') {
            return done(null, null);
          }
          authKeyCloakAdmin(issuer, kid, done);
        } else {
          return done(null, null);
        }
      });
    } else {
      authKeyCloakAdmin(issuer, kid, done);
    }
  } catch (err) {
    logger.error(err);
    return done(null, null);
  }
};

export const createKeycloakStrategy = () => {
  const strategy = new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      secretOrKeyProvider: kcKeyProvider,
    },
    (payload, done) => {
      done(null, {
        id: payload.sub,
        name: payload.name || payload.preferred_username,
        email: payload.email,
        roles: payload.realm_access.roles,
        organizationId: payload.organizationId,
        tokenIssuer: payload.iss,
        client: payload?.azp,
        tenantName: getTenantName(payload.iss),
      });
    }
  );

  return strategy;
};
