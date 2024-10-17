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

| name            | description                                                                                            |
| :-------------- | :----------------------------------------------------------------------------------------------------- |
| directory-admin | Administrator role for directory service. This role allows administrators to modify directory entries. |
| resource-browser| Resource browser role for the directory service that grants access to resources and tags. |
| resource-tagger | Resource tagger role for the directory service that allows tagging and untagging resources. |
| resource-resolver | Resource resolver used by the directory. Resource APIs should give read access to the role. |

The directory service API allows anonymous read access of entries.

## Concepts

### Entry
Entries represent a registered service or API in the directory. Tenant entries are created under a tenant namespace based on the tenant name.

### Resource
A resource is something addressable at a path under an API registered in the directory that can be tagged. The directory does not understand the domain specific concept represented by each resource, but supports tagging and untagging resources so that resources across different APIs can be categorized and group together.

#### URN convention
The directory uses a URN convention to resolve full request paths to resources. The resource URN is expected to be in the form `urn:ads:{namespace}:{service}:{api}:{resource}`, and the resource segment is assumed to be the relative path under the API. The directory looks up the API URL, then joins the resource path under the API path for the resource URL.

For example `urn:ads:platform:file-service:v1:/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c` resolves to API URL `https://file-service.adsp.alberta.ca/file/v1` and resource path `/files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c` resulting in resource URL of `https://file-service.adsp.alberta.ca/file/v1//files/ff118afa-f74e-44ac-8866-7ebd5a43cb4c`.

### Resource type
Resource types are configuration that tell the directory how to resolve the name and description of a resource from the return value of a GET request to the resource path on its associated API. They can indicate if a domain event represents the deletion of a resource, so that deletions can cascade to the directory.

### Tag
Tags are simple string labels that can be associated to resources, and can be used to represent categories and projects.

## Code examples

### Reading the directory

```typescript
const response = await fetch('https://directory.adsp.alberta.ca/directory/v2/namespaces/platform/entries', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const entries = await response.json();
```
