/**
 * Artillery processor for Feedback Service load test
 *
 * Responsibilities:
 * 1. Authenticate to Keycloak using Resource Owner Password Credentials (username/password)
 * 2. Cache token to reduce Keycloak load
 * 3. Expose token to scenarios via context.vars.token
 */

import axios from 'axios';
import { URLSearchParams } from 'url';

/**
 * Token cache shared across VUs in the same worker process
 */
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Utility: Mask secrets in logs
 */
function maskSecret(secret) {
  if (!secret) return null;
  return secret.slice(0, 4) + '...' + secret.slice(-4);
}

/**
 * Utility: Mask tokens in logs
 */
function maskToken(token) {
  if (!token) return null;
  return token.slice(0, 6) + '...' + token.slice(-6);
}

/**
 * Fetch Keycloak token using username/password grant
 */
async function fetchToken({ keycloakUrl, realmId, clientId, clientSecret, username, password }) {
  const tokenUrl = `${keycloakUrl}/auth/realms/${realmId}/protocol/openid-connect/token`;

  // Build form-encoded body for Keycloak token request
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username: username,
    password: password,
  });

  // Replace '+' with '%20' for spaces
  const body = params.toString().replace(/\+/g, '%20');

  console.log('--- Token Request Info ---');
  console.log('URL:', tokenUrl);
  console.log('Headers:', { 'Content-Type': 'application/x-www-form-urlencoded' });

  // Mask the secret in logs
  const maskedBody = params
    .toString()
    .replace(/client_secret=[^&]+/, `client_secret=${encodeURIComponent(maskSecret(clientSecret))}`);

  console.log('Body:', maskedBody);
  console.log('--------------------------');

  try {
    // Send request to Keycloak
    const response = await axios.post(tokenUrl, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log('--- Token Response ---');
    console.log('Status:', response.status);
    console.log('Response received (body hidden)');
    console.log('----------------------');

    return {
      token: response.data.access_token,
      expiresIn: response.data.expires_in,
    };
  } catch (err) {
    console.log('--- Token Request Error ---');

    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Headers:', err.response.headers);
    } else {
      console.log('Error:', err.message);
    }

    console.log('----------------------------');
    throw err;
  }
}

/**
 * beforeScenario hook:
 * - Ensures valid token exists (caches token)
 * - Attaches token to context.vars for scenario use
 */
export async function beforeScenario(context) {
  console.log('🔥 beforeScenario invoked');

  // Read CSV values
  const keycloakUrl = context.vars.keycloak_url?.trim();
  const realmId = context.vars.realm_id?.trim();
  const tenantName = context.vars.tenant_name?.trim();
  const clientId = context.vars.client_id?.trim();

  // Username from CSV
  const username = context.vars.username?.trim();

  // Secrets from environment variables
  const clientSecret = process.env.ARTILLERY_CLIENT_SECRET;
  const password = process.env.ARTILLERY_USER_PASSWORD;

  // console.log('CSV values:', { keycloakUrl, realmId, tenantName, clientId, username });
  // console.log('Secret:', maskSecret(clientSecret));
  // console.log('password:', maskSecret(password)); // uncomment for debugging

  // Validate inputs
  if (!keycloakUrl || !realmId || !tenantName || !clientId || !clientSecret || !username || !password) {
    throw new Error('Missing required CSV fields or secret');
  }

  const now = Date.now();

  // Fetch a new token if none exists or token expired
  if (!cachedToken || now >= tokenExpiresAt) {
    const oldToken = cachedToken;

    const { token: newToken, expiresIn } = await fetchToken({
      keycloakUrl,
      realmId,
      clientId,
      clientSecret,
      username,
      password,
    });

    console.log('🔐 Old token:', maskToken(oldToken));
    console.log('🔐 New token:', maskToken(newToken));

    if (oldToken) {
      if (oldToken === newToken) {
        console.log('➡️ Token is the SAME as previous token');
      } else {
        console.log('➡️ Token is DIFFERENT from previous token');
      }
    } else {
      console.log('➡️ First token fetched:', maskToken(newToken));
    }

    cachedToken = newToken;
    tokenExpiresAt = now + Math.min(expiresIn * 1000, 4 * 60 * 1000);
  } else {
    console.log('Token still valid, using cached token');
  }

  // Make token available to YAML via {{ token }}
  context.vars.token = cachedToken;
}
