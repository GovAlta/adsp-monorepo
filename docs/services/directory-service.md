---
layout: page
title: Directory service
nav_order: 3
parent: Services
---

# Directory service

Directory service is a register of services and APIs. It allows you to find service URLs matched to logical URNs of the form: `urn:ads:{namespace}:{service}:{api}`. Consumers can use this service for client-side service discovery. The directory service also provides a resource API that allows tagging of resources under APIs registered in the directory; this allows users to tag and search for resources across APIs.

## Client roles

client `urn:ads:platform:directory-service`

| name              | description                                                                                                               |
| :---------------- | :------------------------------------------------------------------------------------------------------------------------ |
| directory-admin   | Administrator role for directory service. Allows adding, updating, and deleting entries, and deleting tags and resources. |
| resource-browser  | Resource browser role for the directory service that grants access to resources and tags.                                 |
| resource-tagger   | Resource tagger role for the directory service that allows tagging and untagging resources. Also grants read access.      |
| resource-resolver | Resource resolver used by the directory. Resource APIs should give read access to the role.                               |

The directory-admin, resource-browser, and resource-tagger roles are part of the tenant admin role.

Reading directory entries does not require a token; the directory API allows anonymous read access.

## Tenancy

Each tenant has a directory **namespace** named after the tenant: the tenant name in kebab case (for example `test-tenant` for the tenant named Test Tenant). Platform services are registered in the `platform` namespace, which is the namespace the SDK reads.

- **Directory API (`/directory/v2`)**: the namespace in the path selects the tenant. The directory looks up the tenant by name (hyphens read as spaces, ignoring case) and responds `404` if no tenant has that name.
  - Reads are anonymous, so any caller can read the entries of any namespace.
  - Writes require the directory-admin role held by a user or service account **of the namespace's tenant**. Core (platform) users and users of other tenants receive `403`. `POST /namespaces` creates the namespace of the caller's own tenant, so it also requires a tenant user or service account.
- **Resource API (`/resource/v1`)**: tags and resources belong to one tenant, and tenant users always act on the tenant of their token. A tag or resource of another tenant responds `404`, is left out of lists, and deletes respond `deleted: false`; the directory never responds `403` for it.
  - Core (platform) users are refused (`403`) by all resource endpoints except `GET /tags/{tag}`, which allows core users with the resource-browser, resource-tagger, or resource-resolver role. They act on the tenant given by the `tenantId` query parameter, and on platform tags without it.
- **Resource types** are configured in the [configuration service](configuration-service.md) under `platform:directory-service`. The directory combines the platform (core) configuration with the tenant's configuration by API; where both configure the same API, the platform configuration is used.

## API overview

The directory API is under `https://directory-service.adsp.alberta.ca/directory/v2` and the resource API is under `https://directory-service.adsp.alberta.ca/resource/v1`. See the [API documentation](https://api.adsp.alberta.ca) for request and response schemas.

| Area              | Endpoints                                                                                                                                                    | Required role                                                                |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Directory entries | `GET /directory/v2/namespaces/{namespace}/entries`, `GET .../services/{service}`, `GET .../services/{service}/apis`, `GET .../services/{service}/apis/{api}` | None (anonymous)                                                             |
|                   | `POST /directory/v2/namespaces`                                                                                                                              | directory-admin                                                              |
|                   | `POST .../services`, `PATCH\|DELETE .../services/{service}`, `POST .../services/{service}/apis`, `PATCH\|DELETE .../services/{service}/apis/{api}`           | directory-admin in the namespace's tenant                                    |
| Tags              | `GET /resource/v1/tags`, `GET /resource/v1/tags/{tag}/resources`                                                                                             | resource-browser or resource-tagger                                          |
|                   | `GET /resource/v1/tags/{tag}`                                                                                                                                | resource-browser, resource-tagger, or resource-resolver (core users allowed) |
|                   | `POST /resource/v1/tags` (tag and untag)                                                                                                                     | resource-tagger                                                              |
|                   | `DELETE /resource/v1/tags/{tag}`                                                                                                                             | directory-admin                                                              |
| Resources         | `GET /resource/v1/resources`, `GET /resource/v1/resources/{resource}`, `GET /resource/v1/resources/{resource}/tags`                                          | resource-browser or resource-tagger                                          |
|                   | `DELETE /resource/v1/resources/{resource}`                                                                                                                   | directory-admin                                                              |

`...` stands for `/directory/v2/namespaces/{namespace}`. Resource URNs in paths must be URL encoded. Resource types have no endpoints of their own; they are managed through the [configuration service](configuration-service.md).

## Concepts

### Entry

Entries represent a registered service or API in the directory. Tenant entries are created under a tenant namespace based on the tenant name. A service entry is named after the service (for example `form-service`), and an API entry is named `{service}:{api}` (for example `form-service:v1`). The URN of an entry is `urn:ads:{namespace}:{service}` or `urn:ads:{namespace}:{service}:{api}`. An API entry can exist without its service entry.

### Service metadata

Services can publish metadata, such as their name, description, and links to their APIs and documentation, at the service URL. `GET .../services/{service}` returns the service entry with that metadata, which the directory retrieves from the service and caches for 5 minutes.

### Resource

A resource is something addressable at a path under an API registered in the directory that can be tagged. The directory does not understand the domain specific concept represented by each resource, but supports tagging and untagging resources so that resources across different APIs can be categorized and group together.

#### URN convention

The directory uses a URN convention to resolve full request paths to resources. The resource URN is expected to be in the form `urn:ads:{namespace}:{service}:{api}:{resource}`, and the resource segment is assumed to be the relative path under the API. The directory looks up the API URL, then joins the resource path under the API path for the resource URL.

For example `urn:ads:platform:file-service:v1:/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c` resolves to API URL `https://file-service.adsp.alberta.ca/file/v1` and resource path `/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c` resulting in resource URL of `https://file-service.adsp.alberta.ca/file/v1/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c`.

### Resource type

Resource types are configuration that tell the directory how to resolve the name and description of a resource from the return value of a GET request to the resource path on its associated API. They can indicate if a domain event represents the deletion of a resource, so that deletions can cascade to the directory. When a new resource is tagged, the directory resolves its name, description, and type in the background, using the directory's own service account; resource APIs should give the resource-resolver role read access.

### Tag

Tags are simple string labels that can be associated to resources, and can be used to represent categories and projects. Each tag has a `label` and a `value`; the value is the label in kebab case unless one is given, and identifies the tag in paths.

## Audit

Directory service records an audit event when entries (services and APIs), namespaces, tags, or tagged resources are created, changed, or deleted. Reads and bootstrap seeding are not audited. Audit failures are logged by the SDK and do not fail the directory operation. The directory service account requires the `audit-writer` role of `urn:ads:platform:audit-service`.

Audit recording is on by default. Set the environment variable `DIRECTORY_AUDIT_ENABLED=false` on directory service to turn it off, or `true` to turn it on regardless of the SDK `AUDIT_ENABLED` variable, which applies when `DIRECTORY_AUDIT_ENABLED` is not set. The action catalog is still registered while recording is off, so turning it back on needs only a restart.

## Events

The directory service sends the following domain events under the `directory-service` namespace:

| Event                        | Description                                                       |
| :--------------------------- | :---------------------------------------------------------------- |
| `entry-updated`              | A directory entry was added or its URL updated.                   |
| `entry-deleted`              | A directory entry was deleted.                                    |
| `tagged-resource`            | A tag was added to a resource.                                    |
| `untagged-resource`          | A tag was removed from a resource.                                |
| `resource-deleted`           | A resource was deleted.                                           |
| `tag-deleted`                | A tag was deleted.                                                |
| `resource-resolution-failed` | A resource associated with a resource type could not be resolved. |

The `directory-entry-updates` stream in the [push service](push-service.md) provides the `entry-updated` and `entry-deleted` events to platform services.

The directory consumes its own `tagged-resource` events to resolve new resources, and the delete events configured on resource types to delete the matching resources.

## Code examples

### Read the entries of a namespace

```typescript
const response = await fetch('https://directory-service.adsp.alberta.ca/directory/v2/namespaces/platform/entries');

// Each entry has urn, url, service, and namespace.
const entries: { urn: string; url: string }[] = await response.json();
const formApi = entries.find(({ urn }) => urn === 'urn:ads:platform:form-service:v1');
```

### Register a service API

Users with the directory-admin role can add entries to the namespace of their tenant. The directory responds `409` if the entry already exists; use `PATCH` to change its URL.

```typescript
const response = await fetch(
  'https://directory-service.adsp.alberta.ca/directory/v2/namespaces/test-tenant/services/case-service/apis',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ api: 'v1', url: 'https://case-service.test.gov.ab.ca/case/v1' }),
  },
);

// Entry as stored, for example { service: 'case-service:v1', host: 'https://case-service.test.gov.ab.ca/case/v1' }.
const { service, host } = await response.json();
```

### Tag a resource

Users with the resource-tagger role can tag resources under APIs registered in the directory.

```typescript
const response = await fetch('https://directory-service.adsp.alberta.ca/resource/v1/tags', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    operation: 'tag-resource',
    tag: { label: 'Priority applications' },
    resource: { urn: 'urn:ads:platform:file-service:v1:/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c' },
  }),
});

// tagged is false if the resource already had the tag.
const { tagged, tag } = await response.json();
```

### Find the resources with a tag

```typescript
const response = await fetch(
  'https://directory-service.adsp.alberta.ca/resource/v1/tags/priority-applications/resources?top=50&includeRepresents=true',
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

// _embedded.represents is the resource retrieved from its API, for resources that match a resource type.
const { results, page } = await response.json();
const next = page.next; // Pass as the after parameter for the next page.
```
