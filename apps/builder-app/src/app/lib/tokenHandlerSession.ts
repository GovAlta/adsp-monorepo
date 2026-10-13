// The preview makes platform API requests through the token handler, which is proxied at /token-handler on the
// builder's origin and needs a session for the user. The builder signs the user in when it loads.

export const BUILDER_PREVIEW_CLIENT_ID = 'builder-preview';

const PROXY_PATH = '/token-handler';
const ATTEMPT_KEY = 'builder:token-handler-sign-in-attempted';
const RETURN_TO_KEY = 'builder:token-handler-return-to';

export type TokenHandlerSessionStatus = 'ready' | 'redirecting' | 'unavailable';

export const createSignInUrl = (tenantName: string, origin = window.location.origin): string => {
  const clientPath = `${PROXY_PATH}/clients/${BUILDER_PREVIEW_CLIENT_ID}`;
  const callbackUrl = `${origin}${clientPath}/callback`;
  return `${clientPath}/auth?tenant=${encodeURIComponent(tenantName)}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
};

/** Only paths within the builder are allowed as the place to return to after signing in. */
export const sanitizeReturnPath = (path: string | null): string =>
  path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') ? path : '/';

export const takeReturnPath = (): string => {
  const path = sanitizeReturnPath(sessionStorage.getItem(RETURN_TO_KEY));
  sessionStorage.removeItem(RETURN_TO_KEY);
  return path;
};

/**
 * Makes sure that the user has a token handler session, signing them in if not. The user is signed in to access
 * service already, so the sign in redirects straight back to the builder.
 *
 * Unavailable is returned if the user cannot be signed in; e.g. the client is not registered for the tenant. Sign in
 * is only attempted once for the tab, so a failed attempt does not repeat.
 */
export async function ensureTokenHandlerSession(
  tenantName: string,
  returnPath: string,
  navigate: (url: string) => void = (url) => window.location.assign(url)
): Promise<TokenHandlerSessionStatus> {
  try {
    const session = await fetch(`${PROXY_PATH}/sessions`);
    if (session.ok) {
      sessionStorage.removeItem(ATTEMPT_KEY);
      return 'ready';
    }

    if (sessionStorage.getItem(ATTEMPT_KEY)) {
      sessionStorage.removeItem(ATTEMPT_KEY);
      return 'unavailable';
    }

    // Sign in redirects to access service when the client is registered; otherwise the response is an error, which
    // the user should not be sent to.
    const signInUrl = createSignInUrl(tenantName);
    const probe = await fetch(signInUrl, { redirect: 'manual' });
    if (probe.type !== 'opaqueredirect') {
      return 'unavailable';
    }

    sessionStorage.setItem(ATTEMPT_KEY, 'true');
    sessionStorage.setItem(RETURN_TO_KEY, sanitizeReturnPath(returnPath));
    navigate(signInUrl);
    return 'redirecting';
  } catch {
    return 'unavailable';
  }
}
