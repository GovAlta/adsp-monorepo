// Support for requests that go through the token handler, which the site proxies at /token-handler. The token
// handler keeps the user's tokens in a session and adds the access token to requests to its targets.

/** The headers that requests other than GET need; the token handler checks them to prevent cross-site requests. */
export function getCsrfHeaders(): Record<string, string> {
  const match = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  return match ? { 'X-XSRF-TOKEN': decodeURIComponent(match.substring('XSRF-TOKEN='.length)) } : {};
}
