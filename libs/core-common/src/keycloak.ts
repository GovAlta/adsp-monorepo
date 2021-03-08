import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as Logging from './logging';
import jwtDecode from 'jwt-decode';
import * as jwksRsa from 'jwks-rsa';
import * as keycloakInit from './keycloakInit';
import { validateIssuer, validateRealm, getTenantName } from './keycloakCache';

keycloakInit.initTenantApi();

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
    if (!validateIssuer(issuer)) {
      done(null, null);
    }

    const realm = issuer.split('/').slice(-1)[0];

    if (!validateRealm(realm)) {
      done(null, null);
    }

    const jwksUri = issuer + '/protocol/openid-connect/certs';
    const client = createJwkClient({
      jwksUri: jwksUri,
      ...JWK_CLIENT_CONFIG,
    });

    client.getSigningKey(header.kid, (err, key: jwksRsa.SigningKey) => {
      const signingKey = (key as jwksRsa.CertSigningKey)?.publicKey || (key as jwksRsa.RsaSigningKey)?.rsaPublicKey;

      if (signingKey !== null) {
        done(null, signingKey);
      } else {
        logger.error(err);
        done(null, null);
      }
    });
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
      const realm = payload.iss.split('/').slice(-1)[0];
      // TODO: correct the tenant name based on the tenant-management-api
      done(null, {
        id: payload.sub,
        name: payload.name || payload.preferred_username,
        email: payload.email,
        roles: payload.realm_access.roles,
        organizationId: payload.organizationId,
        tokenIssuer: payload.iss,
        tenantName: getTenantName(realm),
      });
    }
  );

  return strategy;
};
