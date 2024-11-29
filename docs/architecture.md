---
layout: page
title: Architecture
nav_order: 3
---

<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

# Architecture
ADSP is a suite of micro-services providing commonly needed capabilities and designed to help teams deliver faster. It is oriented around convention-based and opinionated implementations of a few high level concepts including:

- Multi-tenancy,
- Service discovery,
- Configuration management, and
- Domain events.

The project is structured as a monorepo, and development of platform and tenant services is supported by a set of [SDKs](./platform/platform-node-sdk.md) for popular application frameworks.

## Multi-tenancy
ADSP is designed to be a multi-tenant system and all platform micro-services support tenant requests as well as requests in a **Core (System)** context.

The [Tenant service](./services/tenant-service.md) acts as a register of tenants and each tenant is associated with a JWT issuer (keycloak realm). Services retrieve this information via the tenant service API.

Users and tenant service accounts are authenticated against tenant realms and their requests include JWT bearer tokens signed by the tenant issuer. Platform services verity tokens and map requests to the appropriate tenant context based on the issuer.

### Tenant isolation
ADSP does not use a per tenant instancing approach. Each platform service is a horizontally scaled set of pods that all tenants share. Platform services use the request tenant context to scope API requests to tenant specific records. Platform service accounts are in the **Core** context and are permitted to specify the request tenant context.

How a platform service manages storing tenant specific data is an implementation detail of that service. In general, records are kept in the same database, and each record is stored with a tenant identifier. This is weak tenant isolation, and should be considered if ADSP is used in a different context.

## Service discovery
Clients need to find the services and APIs that provide the capabilities they want to leverage. The [Directory service](./services/directory-service.md) provides a Directory of Services to support client-side service discovery.

The directory keeps entries that map service and API logical URNs to URLs. For example, the tenant service API entry is: `urn:ads:platform:tenant-service:v2` -> `https://tenant-service.adsp.alberta.ca`. This allows clients to find capabilities using logical identifiers instead of endpoint URLs which can change across environments and over time.

### Directory URN convention
Platform services use a convention for URNs, which are used in both service client IDs, and hence JWT `aud` claim, and directory entries.

The convention is:

`urn:ads:<namespace>:<service>:<api>:<resource>`

Where

- `<namespace>` is "`platform`" for platform services, and expected to be the tenant name in kebab case for tenant services;
- `<service>` is the kebab case name of the service, for example "`tenant-service`";
- `<api>` is commonly the API version like "`v2`", and
- `<resource>` is the subpath to an API resource, for example "`/tenants`".

For example, the tenant API tenants resource URN is: `urn:ads:platform:tenant-service:v2:/tenants`.

This allows a client to resolve and address a specific API resource via the directory. `urn:ads:platform:tenant-service:v2:/tenants` is resolved to `https://tenant-service.adsp.alberta.ca/api/tenant/v2/tenants`.

## Configuration management
Platform services use configuration to allow capabilities to be tailored to specific uses. For example, the [PDF service](./services/pdf-service.md) uses configuration for the templates used to generate PDFs. [Configuration service](./services/configuration-service.md) provides the model and API for configuration management.

### Registration
Services configure other services through a process of registration. On startup, services make requests to the configuration API to update configuration of other services that they leverage. For example, the [PDF service](./services/pdf-service.md) registers configuration for the [File service](./services/file-service.md) to define its generated PDF file type.

Tenant services can also register configuration, and their configuration is scoped to the tenant.

## Domain events
Domain events represent occurrences that are of domain significance. For example, the [Form service](./services/form-service.md) signals a domain event when a form is submitted. The [Event service](./services/event-service.md) provides the API for sending domain events.

Domain events are routed over RabbitMQ, and platform services use domain events to trigger effects aside from the service that signalled the event. This allows for augmenting a service with additional capabilities outside its control flow. The [event log](#event-logging) is one such capability that is built into the event service.

Tenant services and applications don't have access to the platform RabbitMQ, but can use the [Push service](./services/push-service.md) as a websocket gateway to receive events.

### Event logging
Domain events sent via the event service are routed to an event logging queue. The event service includes a job that consumes queued events and records them in the event log.

Typically domain events are associated with domain operations and state changes, and the log can serve as an audit trail of changes. However, services may also signal more transitory events for purposes such as to trigger notifications or scripts, and those events can be configured to be excluded from logging to avoid introducing extraneous noise.
