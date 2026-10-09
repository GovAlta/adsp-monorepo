---
layout: page
title: Token handler
nav_order: 17
parent: Services
---

# Token handler
ADSP Token Handler provides the token handler pattern as a service. In the token handler pattern, a backend component acts as a confidential client (relying party) to authenticate end users, stores tokens in sessions, and adds the access token to API requests. This keeps tokens out of the frontend, but requires session management and secure use of cookies.

Token handlers are often implemented in Backend for Frontends (BFFs), but the ADSP implementation provides the capability generically so that light frontend applications can be delivered without a dedicated BFF.

## Client roles
client `urn:ads:platform:token-handler`

| name | description |
|:-|:-|
| token-handler-admin | Administrator role for token handler allowed to register clients. |

## Concepts

### Clients
Clients correspond to OAuth clients (OIDC relying party) in [access service](access-service.md). The token handler requires configuration of clients to support client registration in access service. Registration creates confidential clients (with client ID and secret) which are used to authenticate users.

Clients are configured in the [configuration service](configuration-service.md) under the `platform:token-handler` namespace and name. The frontend application passes the OIDC callback URL at auth initiation time via the `?callbackUrl=` query parameter on the `/auth` endpoint (e.g. `https://myapp.alberta.ca/auth?callbackUrl=https://myapp.alberta.ca/auth/callback`). This means no callback URL needs to be stored in the token handler configuration, and the same configuration works across all environments including local development. Redirect URI validation is handled by access service; the `callbackUrl` provided must be registered in the Keycloak client's *Valid Redirect URIs*.

> **Deprecated fallback:** Existing configurations with `authCallbackUrl` set will continue to work — the token handler extracts the path from `authCallbackUrl` and combines it with the incoming request's host and protocol when no `?callbackUrl=` query parameter is provided.

### Targets
Targets represent upstream services or APIs that the token handler can proxy requests to. For requests from the frontend to the configured targets, token handler will retrieve a valid access token based on the current user session and include it as a bearer token for the upstream request. Target upstream is configured as an ADSP service or API URN, and the URN must have an entry in the [directory service](directory-service.md). Targets are configured as part of clients in the configuration service under the `platform:token-handler` namespace and name.

The upstream request only carries the user's access token for authentication. Token handler does not pass on the session cookie, CSRF token or tenant headers of the incoming request, and cookies set by the upstream are not passed back to the frontend. Request paths must stay within the target's base path; paths with dot segments (`.` or `..`) or encoded path separators are rejected as invalid, and the query string is passed through unchanged.

Target upstreams are resolved from the directory, where tenant administrators can register entries for their own namespace. The operator of token handler can restrict the hosts that target upstreams may use by setting the `UPSTREAM_ALLOWED_DOMAINS` environment variable to a comma-separated list of host names (e.g. `form-service,api.example.ca`) and wildcards for subdomains (e.g. `*.apps.example.ca`, which does not include `apps.example.ca` itself). An entry can include a port (e.g. `form-service:3333`), in which case the upstream must use that port (the default port for the scheme if the URL has none); an entry without a port allows any port on the host, so list the ports of internal services. When it is set, requests to a target whose upstream does not resolve to an allowed host are rejected. Upstreams in the platform namespace (`urn:ads:platform:...`) are not checked, because only platform administrators can register entries in it, so platform services can use cluster internal URLs without listing them; every other namespace is checked, so tenant entries cannot target internal hosts. Only http and https URLs without credentials are accepted, the scheme is not otherwise restricted, and IPv4 addresses must be listed explicitly. Avoid wildcards for public suffixes (e.g. `*.co.uk`), which allow any domain under them. Host names are matched as they appear in the URL and are not resolved. A wildcard matches subdomains at any depth, so `*.example.ca` allows `www.example.ca` and `a.b.example.ca` but not `example.ca`. When the value is set in a YAML file, such as a ConfigMap, quote it if it starts with `*`, e.g. `'*.example.ca,*.example.org'`. When it is not set, upstreams are not restricted and token handler logs a warning on startup. The setting is not part of the tenant configuration, so tenant administrators cannot change it.

### Cross-site request forgery (CSRF)
The token handler uses sessions and cookies which can be vulnerable to CSRF attacks. A Cookie-to-header token is used as CSRF protection. Frontend applications need to read the value of the `XSRF-TOKEN` cookie and include it as the value of the `X-XSRF-TOKEN` header in requests to *targets*; this behavior is built into [Angular](https://angular.io/guide/http-security-xsrf-protection).

### Reverse proxy
Frontend applications must use a reverse proxy to proxy requests to the token handler from the frontend site domain. The token handler sets a session cookie without the domain attribute, and browsers will associate the cookie with the domain of the authorization callback request. Consequently the cookie will only be included on subsequent requests to the site if that callback request is to the same domain as the rest of the site.

The `/clients/${clientId}/auth` and `/clients/${clientId}/callback` endpoints require the tenant ID to be provided in the `X-ADSP-TENANT` header, which can also be addressed via reverse proxy configuration. The header value can be a full tenant URN or the tenant name (e.g. `my-tenant-name`).

#### Nginx configuration example

```
location /auth {
  proxy_pass <token handler URL>/token-handler/v1/clients/my-client;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
  proxy_set_header X-Adsp-Tenant <Tenant URN e.g. urn:ads:platform:tenant-service:v2:/tenants/...>;
}

location /sessions {
  proxy_pass <token handler URL>/token-handler/v1/sessions;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
}

location /api {
  proxy_pass <token handler URL>/token-handler/v1/targets/my-upstream-api;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
}
```

### Local development
There are some special considerations for local development workflows when using the token handler.

- Webpack DevServer proxy can be used to proxy requests to the token handler. The proxy must inject the `X-ADSP-TENANT` header; the tenant name (e.g. `my-tenant`) can be used instead of the full URN.
- The frontend passes `?callbackUrl=http://localhost:<port>/auth/callback` when redirecting to `/auth` for local development. Add this URL to the Keycloak client's *Valid Redirect URIs* directly in the access service admin console — no token handler configuration change is required.
- The token handler can only proxy requests to upstream services and APIs that are registered in directory service; i.e. local running instances of backends cannot be used. In practice, this means that when working with full stack applications, local development of the frontend will require a deployed instance of the backend.

#### Webpack DevServer proxy configuration example

```json
{
  "/auth": {
    "target": "<token handler URL>/token-handler/v1/clients/my-client",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/auth": "" },
    "headers": {
      "X-ADSP-TENANT": "<Tenant name or URN>"
    }
  },
  "/sessions": {
    "target": "<token handler URL>/token-handler/v1/sessions",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/sessions": "" }
  },
  "/api": {
    "target": "<token handler URL>/token-handler/v1/targets/my-upstream-api",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/api": "" }
  }
}
```

## Code examples

### Register a client
Registering a client creates a confidential client in access service and securely stores the associated client ID and secret in token handler. It is required before token handler can authenticate users using the client. The optional `authCallbackUrl` provided here is registered with access service as a valid redirect URI and is not stored in the token handler configuration. If it is not provided, the client is registered without redirect URIs, which must then be added to the client in access service (Keycloak) before users can sign in. Registering a client that is already registered replaces its registration: the previously registered client in access service is deleted, including any redirect URIs configured on it.

```typescript
  const response = await fetch(
    `https://adsp.alberta.ca/api/token-handler/v1/clients/${clientId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registrationToken,
        authCallbackUrl: 'https://myapp.alberta.ca/auth/callback',
      }),
    }
  );

  const {
    registered
  } = await response.json();
```

### Update client registration
Updating a client's registration allows changing the registered redirect URIs in access service without creating a new client or invalidating existing sessions. This uses the management token stored from the original registration, so no external token is required.

```typescript
  const response = await fetch(
    `https://adsp.alberta.ca/api/token-handler/v1/clients/${clientId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        redirectUris: [
          'https://myapp.alberta.ca/auth/callback',
          'http://localhost:4200/auth/callback',
        ],
      }),
    }
  );

  const {
    updated
  } = await response.json();
```

### Retrieving session information
Frontend application can determine if the user is logged in and access their session information via the sessions endpoint.

```typescript
  const response = await fetch(
    '/sessions',
    {
      method: 'GET',
    }
  );

  const [session] = await response.json();
```
