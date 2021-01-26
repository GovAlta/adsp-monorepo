import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import * as jwksRsa from 'jwks-rsa';

export interface KeycloakStrategyProps {
  KEYCLOAK_ROOT_URL: string
  KEYCLOAK_REALM: string
}


export interface TokenRequestProps {
  url: string
  clientId: string
  clientSecret: string
}

export const getKeycloakTokenRequestProps = ({ 
  KEYCLOAK_ROOT_URL, 
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET
}): TokenRequestProps => ({
  url: `${KEYCLOAK_ROOT_URL}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
  clientId: KEYCLOAK_CLIENT_ID,
  clientSecret: KEYCLOAK_CLIENT_SECRET
})

export const createKeycloakStrategy = ({ 
  KEYCLOAK_ROOT_URL, 
  KEYCLOAK_REALM
}: KeycloakStrategyProps) => {
  const strategy = new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([
      ExtractJwt.fromAuthHeaderAsBearerToken(),
      ExtractJwt.fromUrlQueryParameter('token')
    ]),
    secretOrKeyProvider: jwksRsa.passportJwtSecret({ 
      jwksUri: `${KEYCLOAK_ROOT_URL}/auth/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
      cache: true }),
    issuer: `${KEYCLOAK_ROOT_URL}/auth/realms/${KEYCLOAK_REALM}`
  }, (payload, done) => {
    done(null, {
      id: payload.sub,
      name: payload.name || payload.preferred_username,
      email: payload.email,
      roles: payload.realm_access.roles,
      organizationId: payload.organizationId
    })
  });

  return strategy;
}
