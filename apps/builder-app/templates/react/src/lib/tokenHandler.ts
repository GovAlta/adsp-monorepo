// Support for requests that go through the token handler, which the site proxies at /token-handler. The token
// handler keeps the user's tokens in a session and adds the access token to requests to its targets.

/** The headers that requests other than GET need; the token handler checks them to prevent cross-site requests. */
export function getCsrfHeaders(): Record<string, string> {
  const match = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  return match ? { 'X-XSRF-TOKEN': decodeURIComponent(match.substring('XSRF-TOKEN='.length)) } : {};
}

// The token handler does not check these methods, so they do not need the header.
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * fetch for requests that may go through the token handler: requests other than GET get the CSRF header when the
 * token handler's cookie is present. Use it for all API requests.
 */
export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (SAFE_METHODS.includes(method)) {
    return fetch(input, init);
  }

  const headers = new Headers(init.headers);
  Object.entries(getCsrfHeaders()).forEach(([name, value]) => headers.set(name, value));
  return fetch(input, { ...init, headers });
}
