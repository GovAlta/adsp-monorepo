---
layout: page
title: Cache service
parent: Services
---

# Cache service

Cache service provides a read-through cache to upstream _targets_. Unlike generic HTTP shared cache solutions, the cache service is integrated into the ADSP multi-tenant security layer and user context aware. This allows it to cache resources protected by role-based access control (RBAC) using user-specific cache entries.

## Client roles

client `urn:ads:platform:cache-service`

| name         | description                                                                    |
| :----------- | :----------------------------------------------------------------------------- |
| cache-reader | Reader role that allows a user to make requests through the cache service API. |

Requests without a JWT bearer token in the `Authorization` header don't have any user context for cache service and associated responses are cached and shared across anonymous users. This is similar to regular HTTP shared caches.

Requests with a JWT bearer token in the `Authorization` header are handled in the user context. The user needs the `cache-reader` role in the tenant (core users with the role are also allowed), the credential is passed through for the upstream request, and associated responses are cached in the user context (effectively including `sub`, `aud`, `scope`, and claims related to roles). A bearer token that fails validation (for example an expired token) is not rejected; the request is handled as an anonymous request. This means that:

- Two users making the same request will not share a cache entry
- One user authenticated in two contexts with different `aud` claim, such as from a limited public application and from a private application, making the same request will not share a cache entry between contexts.
- One user with two different short-lived access tokens making the same request can share a cache entry if the cache entry did not expire between requests. This is because access token specific claims like `exp` are not included in the user context for caching.

## Tenancy

- **Which tenant is used.** Tenant users and service accounts act on the tenant of their token. Core users set the tenant with the `tenantId` query parameter. Anonymous requests have no token, so they also set the tenant with `tenantId` (for example `?tenantId=urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7`). Without a tenant context the request is rejected with 400. The `tenantId` parameter is also forwarded to the upstream request with the rest of the query.
- **Targets.** Targets are read from the tenant's `platform:cache-service` configuration combined with the platform (core) configuration. When both define the same target, the platform configuration wins. The platform configuration includes the [access service](#access-target) target, so it is available in every tenant.
- **Isolation.** Cache entries are keyed on the tenant, so tenants never share entries. A target that isn't configured for the tenant responds 404. The upstream request is made with the caller's credential, so the upstream service applies its own tenant and role checks.

## API overview

All endpoints are under `https://cache-service.adsp.alberta.ca/cache/v1`. See the [API documentation](https://api.adsp.alberta.ca) for parameters and responses.

| Endpoint                                  | Purpose                                                                                                                                            | Required role                                                                                                        |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `GET /cache/v1/cache/{target}/{resource}` | Read a resource from an upstream target through the cache. `{resource}` is the path relative to the target's URL and can contain several segments. | `cache-reader` for requests with a bearer token; anonymous requests are allowed except for the access service target |

Responses from upstream, including their status code, are passed through with an `adsp-cache-status` header. Requests are rejected with 400 if there is no tenant context or the client doesn't accept `gzip`, 401 for anonymous requests to the access service target, 403 for users without the `cache-reader` role, and 404 if the target isn't configured.

Targets are configured through the [configuration service](configuration-service.md); cache service has no endpoints of its own for them.

## Concepts

### Target

Targets are upstream services and APIs that cache service can provide read-through requests to. This configuration is a whitelist that restricts the upstream resources available through the cache service API. Targets are configured as service or API URNs and must be registered in [directory service](directory-service.md). Each target can set a `ttl` in seconds and `invalidationEvents`, which name the domain events (`namespace` and `name`) and the `resourceIdPath` in the event payload of the resource URN to invalidate. Targets are configured in the [configuration service](configuration-service.md) under the `platform:cache-service` namespace and name.

### Access target

Cache service includes a special target for the [access service](access-service.md) admin API at `urn:ads:platform:access-service:v1`. This target is pre-configured for read-through to the admin API, and includes specific invalidation logic based on admin events. Note invalidation requires that the `adsp-event-listener` must be enabled in the tenant realm so that admin events are signaled via the [event service](event-service.md).

Requests through the access target require a user context, and the resource path must start with the tenant's realm (for example `my-tenant/users`). Responses are cached for 30 days unless invalidated by an admin event.

## Limitations

### Cache context

For each request, the cache service generically generates a cache key based on the request context including the request path, query, and user context. Matrix and custom header based parameters are not included.

The cache user context only includes a subset of values from the request access token including `sub`, `aud`, `scope`, and roles related claims based on the default roles mapper. This allows cache entries to be reused across different access tokens, different relying party clients `azp`, and if basic profile attributes like name and email change. However, this means that non-RBAC based permission schemes will not generally work correctly with user context cache entries.

### Cache invalidation

Cache invalidation is supported using a configurable TTL (15 minutes by default) and via invalidation events. The cache key is a digest of the request values and cache service does not generally understand the semantic meaning of values (e.g. if an element of the path is a unique identifier of a domain entity). However, the cache service includes the cache key in an invalidation context set, which unlike the cache key is based only on the tenant and request path. Domain events that include the URN of an affected resource can be used to invalidate the set associated with that resource path. Note that the resource URN must be resolvable by the [directory](directory-service.md).

### Cached responses

Upstream responses with an empty body, a body of 1 MB or more, or a status code in the 500s are passed through to the client but not cached. Upstream `401` responses are cached for only 30 seconds, since they can be caused by transient token validation issues. Only the `Content-Type`, `Content-Encoding`, `Content-Length`, `Cache-Control`, and `Content-Disposition` headers of the upstream response are returned.

### Client gzip support

Cache service makes upstream requests with `Accept-Encoding` header value of `gzip` and will cache the response content in its compressed form if the upstream server supports `gzip`. It will not decompress the content for clients, and so it will reject requests where `Accept-Encoding` indicates client does not accept `gzip`.

## Events

Cache service does not send domain events.

It consumes domain events from the [event service](event-service.md) to invalidate cache entries: events matching a target's `invalidationEvents`, and access service admin events for the access target. Events that don't match a target are ignored.

## Code examples

### Configure a target

Targets are configured using the [configuration service](configuration-service.md). Note that new configuration may take up to 15 mins to apply.

```typescript
const configurationServiceUrl = 'https://configuration-service.adsp.alberta.ca';

const request = {
  operation: 'UPDATE',
  update: {
    targets: {
      'urn:ads:platform:file-service:v1': {
        ttl: 900,
        invalidationEvents: [{ namespace: 'file-service', name: 'file-deleted', resourceIdPath: 'file.urn' }],
      },
    },
  },
};

await fetch(`${configurationServiceUrl}/configuration/v2/configuration/platform/cache-service`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(request),
});
```

### Download file through cache

```typescript
const fileApiId = 'urn:ads:platform:file-service:v1';
const fileId = '52269261-45c0-434e-9467-a888f0bcb4b7';
const response = await fetch(
  `https://cache-service.adsp.alberta.ca/cache/v1/cache/${fileApiId}/files/${fileId}/download`,
  {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  },
);

const cacheStatus = response.headers.get('adsp-cache-status');
const content = await response.blob();
```

The cache service adds an `adsp-cache-status` header to the response with possible values of `HIT` and `MISS` to indicate if the response was retrieved from cache.

### Read anonymously through cache

Anonymous requests name the tenant with the `tenantId` query parameter. Their responses are cached and shared across anonymous users. In this example the file is of a file type that allows anonymous read.

```typescript
const fileApiId = 'urn:ads:platform:file-service:v1';
const tenantId = 'urn:ads:platform:tenant-service:v2:/tenants/61f2e3a8c9b1d2e3f4a5b6c7';
const fileId = '52269261-45c0-434e-9467-a888f0bcb4b7';
const response = await fetch(
  `https://cache-service.adsp.alberta.ca/cache/v1/cache/${fileApiId}/files/${fileId}?tenantId=${encodeURIComponent(tenantId)}`,
);

const { filename, size } = await response.json();
```
