---
layout: page
title: Cache service
nav_order: 20
parent: Services
---

# Cache service
Cache service provides a read-through cache to upstream *targets*. Unlike generic HTTP shared cache solutions, the cache service is integrated into the ADSP multi-tenant security layer and user context aware. This allows it to cache resources protected by role-based access control (RBAC) using user-specific cache entries.

## Client roles
client `urn:ads:platform:cache-service`

| name | description |
|:-|:-|
| cache-reader | Reader role that allows a user to make requests through the cache service API. |

Requests without a JWT bearer token in the `Authorization` header don't have any user context for cache service and associated responses are cached and shared across anonymous users. This is similar to regular HTTP shared caches.

Requests with a JWT bearer token in the `Authorization` header are handled in the user context, the credential is passed through for the upstream request, and associated responses are cached in the user context (effectively including `sub`, `aud`, claims related to roles). This means that:
- Two users making the same request will not share a cache entry
- One user authenticated in two contexts with different `aud` claim, such as from a limited public application and from a private application, making the same request will not share a cache entry between contexts.
- One user with two different short-lived access tokens making the same request can share a cache entry if the cache entry did not expire between requests. This is because access token specific claims like `exp` are not included in the user context for caching.


## Limitations
### Cache context
For each request, the cache service generically generates a cache key based on the request context including the request path, query, and user context. Matrix and custom header based parameters are not included.

The cache user context only includes a subset of values from the request access token including `sub`, `aud`, and roles related claims based on the default roles mapper. This allows cache entries to be reused across different access tokens, different relying party clients `azp`, and if basic profile attributes like name and email change. However, this means that non-RBAC based permission schemes will not generally work correctly with user context cache entries.

### Cache invalidation
The cache key is a digest of the context values and cache service does not generally understand the semantic meaning of values (e.g. if an element of the path is a unique identifier of a domain entity). Consequently cache invalidation of specific entries using domain identifiers is not possible. The only supported mechanism for cache invalidation is through time based expiry using a Time to Live (TTL).

### Client gzip support
Cache service makes upstream requests with `Accept-Encoding` header value of `gzip` and will cache the response content in its compressed form if the upstream server supports `gzip`. It will not decompress the content for clients, and so it will reject requests where `Accept-Encoding` indicates client does not accept `gzip`.

## Concepts
### Target
Targets are upstream services and APIs that cache service can provide read-through requests to. This configuration is a whitelist that restricts the upstream resources available through the cache service API. Targets are configured as service or API URNs and must be registered in [directory service](directory-service.md), and an associated TTL can be set. Targets are configured in the [configuration service](configuration-service.md) under the `platform:cache-service` namespace and name.


## Code examples
### Download file through cache
```typescript
  const fileApiId = 'urn:ads:platform:file-service:v1';
  const fileId = '52269261-45c0-434e-9467-a888f0bcb4b7';
  await fetch(
    `https://cache-service.adsp.alberta.ca/cache/v1/cache/${fileApiId}/files/${fileId}/download`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );
```

The cache service will add an `adsp-cache-status` header to the response with possible values of `HIT` and `MISS` to indicate if the response was retrieved from cache.
