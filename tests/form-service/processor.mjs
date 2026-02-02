/**
 * Artillery processor
 *
 * Responsibilities:
 * 1. Fetch and cache Keycloak access tokens using password grant
 * 2. Expose Bearer token to Artillery scenarios
 * 3. Decide per-VU behavior (update / submit percentages)
 */

import axios from 'axios';
import { URLSearchParams } from 'url';

/**
 * Cached token shared across VUs in the same worker process
 * Reduces load on Keycloak during tests
 */
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Utility helpers to mask secrets in logs
 */
function maskSecret(secret) {
  if (!secret) return null;
  return secret.slice(0, 4) + '...' + secret.slice(-4);
}

function maskToken(token) {
  if (!token) return null;
  return token.slice(0, 6) + '...' + token.slice(-6);
}

/**
 * Fetch access token from Keycloak using Resource Owner Password Credentials
 *
 * @param {Object} params
 * @returns {Promise<{token: string, expiresIn: number}>}
 */
async function fetchToken({ keycloakUrl, realmId, clientId, clientSecret, username, password }) {
  const tokenUrl = `${keycloakUrl}/auth/realms/${realmId}/protocol/openid-connect/token`;

  // Build token request body
  const params = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    client_secret: clientSecret,
    username,
    password,
  });

  // Encode spaces correctly for Keycloak
  const body = params.toString().replace(/\+/g, '%20');

  console.log('--- Token Request Info ---');
  console.log('URL:', tokenUrl);
  console.log('Headers:', { 'Content-Type': 'application/x-www-form-urlencoded' });

  // Mask client secret in logs
  const maskedBody = params
    .toString()
    .replace(/client_secret=[^&]+/, `client_secret=${encodeURIComponent(maskSecret(clientSecret))}`);

  console.log('Body:', maskedBody);
  console.log('--------------------------');

  try {
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
 * Artillery lifecycle hook
 *
 * Runs once per VU before the scenario starts.
 * Used for:
 *  - token acquisition & caching
 *  - per-VU behavior decisions
 */
export async function beforeScenario(context) {
  console.log('🔥 beforeScenario invoked');

  // Values loaded from CSV
  const keycloakUrl = context.vars.keycloak_url?.trim();
  const realmId = context.vars.realm_id?.trim();
  const tenantName = context.vars.tenant_name?.trim();
  const clientId = context.vars.client_id?.trim();
  const username = context.vars.username?.trim();

  // Secrets injected via environment variables
  const clientSecret = process.env.ARTILLERY_CLIENT_SECRET;
  const password = process.env.ARTILLERY_USER_PASSWORD;

  // console.log('CSV values:', {
  //   keycloakUrl,
  //   realmId,
  //   tenantName,
  //   clientId,
  //   username,
  // });
  // console.log('Client secret:', maskSecret(clientSecret));
  // console.log('Password:', maskSecret(password)); // intentionally hidden

  // Validate required inputs
  if (!keycloakUrl || !realmId || !tenantName || !clientId || !clientSecret || !username || !password) {
    throw new Error('Missing required CSV fields or environment secrets');
  }

  const now = Date.now();

  /**
   * Token caching logic
   * - Fetch new token if none exists or if expired
   * - Otherwise reuse cached token
   *
   * Token lifetime capped at 4 minutes to avoid edge expiry
   */
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

    cachedToken = newToken;
    tokenExpiresAt = now + Math.min(expiresIn * 1000, 4 * 60 * 1000);
  } else {
    console.log('Token still valid, using cached token');
  }

  /**
   * Expose Bearer token to Artillery scenarios
   * Referenced in YAML as: {{ token }}
   */
  context.vars.token = cachedToken;

  // =====================================================
  // Per-VU behavior control (probabilistic branching)
  // =====================================================

  /**
   * 80% of VUs will update the form
   */
  context.vars.doUpdate = Math.random() < 0.8;

  /**
   * 50% of the updating VUs will submit
   * (≈40% total submission rate)
   */
  context.vars.doSubmit = context.vars.doUpdate && Math.random() < 0.5;

  /**
   * Number of update operations per VU (1–5)
   * Adds realism to update behavior
   */
  context.vars.updateCount = Math.floor(Math.random() * 5) + 1;
}
