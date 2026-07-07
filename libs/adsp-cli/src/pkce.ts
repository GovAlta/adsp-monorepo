import { createHash, randomBytes } from 'crypto';

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * RFC 7636 PKCE pair — S256 challenge method, the only method the Keycloak adsp-cli client accepts
 * (its `pkce.code.challenge.method` attribute is set to 'S256', so Keycloak rejects any authorization
 * request that doesn't present a matching challenge).
 */
export function generatePkcePair(): PkcePair {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}
