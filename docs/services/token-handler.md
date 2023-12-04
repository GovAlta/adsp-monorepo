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

Clients are configured in the [configuration service](configuration-service.md) under the `platform:token-handler` namespace and name. Note that the token handler client configuration controls how the token handler initiates the OIDC authorization request, but the overall behavior is also subject to access service configuration. For example, the `authCallbackUrl` of the token handler client determines the URL used when initiating the authorization flow, but whether the URL is permitted by access service as the OIDC provider is determined by its own *Valid Redirect URIs* configuration.

### Targets
Targets represent upstream services or APIs that the token handler can proxy requests to. For requests from the frontend to the configured targets, token handler will retrieve a valid access token based on the current user session and include it as a bearer token for the upstream request. Target upstream is configured as an ADSP service or API URN, and the URN must have a registered entry in the [directory service](directory-service.md). Targets are configured in the configuration service under the `platform:token-handler` namespace and name.

### Cross-site request forgery (CSRF)
The token handler uses sessions and cookies which can be vulnerable to CSRF attacks. A Cookie-to-header token is used as CSRF protection. Frontend applications need to read the value of the `XSRF-TOKEN` cookie and include it as the value of the `X-XSRF-TOKEN` header in requests to *targets*; this behavior is built into [Angular](https://angular.io/guide/http-security-xsrf-protection).

### Reverse proxy
Frontend applications must use a reverse proxy to proxy requests to the token handler from the frontend site domain. The token handler sets a session cookie without the domain attribute, and browsers will associate the cookie with the domain of the authorization callback request. Consequently the cookie will only be included on subsequent requests to the site if that callback request is to the same domain as the rest of the site.

The `/clients/${clientId}/auth` and `/clients/${clientId}/callback` endpoints require the tenant ID to be provided in the `X-ADSP-TENANT` header, which can also be addressed via reverse proxy configuration.

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

- Webpack DevServer proxy can be used to proxy requests to the token handler, but token handler will not trust the proxy for resolving the request host. In order to bypass host checking for the client, the `disableVerifyHost` property in the client configuration must be set to `true`; this configuration should **NOT** be used in production.
- Token handler and access service client configuration must allow for the callback URL to localhost. So the `authCallbackUrl` must be set for local development.
- The token handler can only proxy requests to upstream services and APIs that are registered in directory service and which it can reached; i.e. local running instances of backends cannot be used. In practice, this means that when working with full stack applications, local development of the frontend will require a deployed instance of the backend.

#### Webpack DevServer proxy configuration example

```json
{
  "/auth": {
    "target": "<token handler URL>/token-handler/v1/clients/my-client",
    "secure": true,
    "changeOrigin": true,
    "pathRewrite": { "^/auth": "" },
    "headers": {
      "X-ADSP-TENANT": "<Tenant URN e.g. urn:ads:platform:tenant-service:v2:/tenants/...>"
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
Registering a client creates a confidential client in access service and securely stores the associated client ID and secret in token handler. It is required before token handler can authenticate users using the client.

```typescript
  const response = await fetch(
    `https://adsp.alberta.ca/api/token-handler/v1/clients/${clientId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: {
        registrationToken
      },
    }
  );

  const {
    registered
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
