/**
 * Query term → extra terms searched along with it, for words people use that the docs don't (or use rarely).
 * Keys and values are single lowercase tokens, as produced by `tokenize`. Expansion is one way: searching a value
 * does not add its key.
 */
export const SEARCH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  auth: ['authentication', 'authorization', 'keycloak', 'login', 'access'],
  authentication: ['keycloak', 'login', 'access'],
  sso: ['keycloak', 'login', 'access'],
  websocket: ['socket', 'push', 'stream'],
  websockets: ['websocket', 'socket', 'push', 'stream'],
  realtime: ['push', 'stream', 'socket'],
  upload: ['file'],
  email: ['notification'],
  notify: ['notification'],
};
