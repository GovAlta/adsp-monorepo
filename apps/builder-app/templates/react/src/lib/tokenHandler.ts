// Sign in and CSRF support for requests that go through the token handler, which the site proxies at /token-handler.
// The token handler keeps the user's tokens in a session and adds the access token to requests to its targets.

export interface TokenHandlerConfig {
  // ID of the token handler client.
  clientId: string;
  // Name of the tenant to sign in to.
  tenantName: string;
}

const PROXY_PATH = '/token-handler';
const SIGN_IN_POLL_MS = 500;

export async function hasSession(): Promise<boolean> {
  const response = await fetch(`${PROXY_PATH}/sessions`);
  return response.ok;
}

/**
 * Signs the user in with a separate window, so that the application keeps its state. Resolves once the window is
 * closed, with whether there is now a session.
 */
export function signIn({ clientId, tenantName }: TokenHandlerConfig): Promise<boolean> {
  const callbackUrl = `${window.location.origin}${PROXY_PATH}/clients/${clientId}/callback`;
  const url =
    `${PROXY_PATH}/clients/${clientId}/auth` +
    `?tenant=${encodeURIComponent(tenantName)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  // This must be called from a user action, or the browser blocks the window.
  const signInWindow = window.open(url, 'token-handler-sign-in', 'width=500,height=700');
  if (!signInWindow) {
    return Promise.reject(new Error('The sign in window was blocked. Allow pop-ups and try again.'));
  }

  return new Promise((resolve) => {
    const timer = window.setInterval(() => {
      if (signInWindow.closed) {
        window.clearInterval(timer);
        hasSession().then(resolve, () => resolve(false));
      }
    }, SIGN_IN_POLL_MS);
  });
}

/** The headers that requests other than GET need; the token handler checks them to prevent cross-site requests. */
export function getCsrfHeaders(): Record<string, string> {
  const match = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  return match ? { 'X-XSRF-TOKEN': decodeURIComponent(match.substring('XSRF-TOKEN='.length)) } : {};
}
