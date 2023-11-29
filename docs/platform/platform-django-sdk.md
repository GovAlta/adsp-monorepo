---
layout: page
title: Service SDK (Django)
nav_order: 6
parent: Platform development
---

<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
1. TOC
{:toc}
</details>

# ADSP service SDK (Django)
Platform services integrate into the foundational capabilities via a Software Development Kit (SDK). The SDK includes interfaces and utilities for handling tenancy, configurations, and registration. The same SDK can be used for development of tenant services.

Note that the SDK provides friendly interfaces on top of APIs. It is intended to speed up service development but is not the only way to access platform capabilities.

Install the ADSP SDK for Django wheel from release artifacts in the repository.

```bash
poetry add https://github.com/GovAlta/adsp-monorepo/releases/download/adsp-service-django-sdk-v1.0.2/adsp_service_django_sdk-1.0.0-py3-none-any.whl
```

## Setting up a service account
The SDK requires credentials for a service account and uses this account for accessing platform capabilities. Fine grained configuration is possible and principle of least privilege should be applied.

In order to create the service account.
1. Create a confidential Client with a client ID in the format: `urn:ads:{tenant}:{service}` . The SDK does not authenticate end users and so all authentication grant types can be disabled.
2. Enable service account for the client.
3. In Service Account Roles, add the appropriate Client Roles for the capabilities that will be accessed:
   1. Client `urn:ads:platform:tenant-service ` role `platform-service` is required.
   2. Client `urn:ads:platform:configuration-service` role `configured-service` is needed for registration and accessing service specific configuration
   3. Client `urn:ads:platform:event-service` role `event-sender` is needed for sending domain events.
4. Additional audiences in the service account access token are required for some capabilities:
   1. Client `urn:ads:platform:push-service` needs to be include via an audience mapper for socket based configuration cache invalidation.

## Initializing the SDK
The SDK includes Django Middleware, View and utility functions. Configure SDK settings in Django settings module.

```python
  MIDDLEWARE = [
    "adsp_service_django_sdk.middleware.AccessRequestMiddleware",
    "adsp_service_django_sdk.middleware.TenantRequestMiddleware",
    ...
  ]

  # ADSP SDK settings
  ADSP_ACCESS_SERVICE_URL = env.get("ADSP_ACCESS_SERVICE_URL")
  ADSP_REALM = env.get("ADSP_REALM")
  ADSP_DIRECTORY_URL = env.get("ADSP_DIRECTORY_URL")
  ADSP_SERVICE_ID = env.get("ADSP_SERVICE_ID", "urn:ads:demo:hello-world-service")
  ADSP_CLIENT_SECRET = env.get("ADSP_CLIENT_SECRET")
```

Register service configuration in a registration module, and identify the module with the `ADSP_REGISTRATION_MODULE` environment variable.
```python
  os.environ.setdefault('ADSP_REGISTRATION_MODULE', 'hello_world_django.registration')
```

```python
  from adsp_service_django_sdk AdspRegistration


  registration = AdspRegistration(
    "Hello world service",
    "Hello world example for Django"
  )
```

## Enabling service metadata
The service directory aggregates service metadata from the root resource of services registered in the directory. This metadata is used to simplify configuration and for OpenAPI documentation aggregation at https://api.adsp.alberta.ca/{tenant}. SDK includes a view for exposing the metadata endpoint.

Enabling service metadata:
```python
  from adsp_service_django_sdk import get_metadata
  from django.urls import path


  urlpatterns = [
    ...,
    path("", get_metadata)
  ]
```

## Authorizing requests
The SDK provides `get_user` function for retrieving the user from a request and `require_user` decorator for authorizing requests.

Require ADSP user for request:
```python
  from adsp_service_django_sdk import get_user, require_user, User
  ...

  @require_user()
  def hello_world(request):
    return f"hello {get_user(request).name}"
```

### Role-based authorization
The SDK maps Keycloak access token `realm_access` and `resource_access` roles to the request user.

Keycloak issued tokens contain client roles nested under `realm_access`. SDK claim mapping flatten service specific roles from the token and qualifies roles related to other service clients with the client ID.

For example:
```json
  {
    "realm_access": { "roles": ["user"] },
    "resource_access": {
      "my-service": { "roles": ["my-user"] },
      "other-service": { "roles": ["other-user"] }
    }
  }
```

For my-service, the roles are mapped to role claims:
- user
- my-user
- other-service:other-user

Authorize based on a role:
```python
  from adsp_service_django_sdk import get_user, require_user, User
  ...

  @require_user("other-service:other-user")
  def hello_world(request):
    return f"hello {get_user(request).name}"
```

Accessing user information directly and checking for role:
```python
  from adsp_service_django_sdk import get_user
  ...

  def hello_world(request):
    has_role = "other-service:other-user" in get_user(request).roles
    ...
```

## Determining tenancy
Requests to platform services are in the context of a specific tenant with few exceptions. The context is implicit when a request is made with a tenant bearer token. It can be explicit in cases where an endpoint allows anonymous access or when a platform service makes a request to another platform service under a core service account.

The SDK `TenantRequestMiddleware` resolves implicit tenancy from user tenancy and explicit from a `tenantId` query parameter. Resolved tenant is set on the request object; no value is set if tenancy cannot be resolved.

Getting tenancy from the context:
```python
  from adsp_service_django_sdk import get_tenant
  ...

  @require_user()
  def hello_world(request):
    return f"hello {get_tenant(request).name}"
```

The handler uses the tenant service client to retrieve tenant information. This is also available from the SDK for direct use. The tenant service is available on the `adsp` variable that can be imported from SDK package.

Getting tenant information using the tenant service:
```python
  from adsp_service_django_sdk import adsp, AdspId


  @require_user()
  def hello_world(request, tenant_id=None):
    tenant = adsp.tenant_service.get_tenant(AdspId.parse(tenant_id))
    ...
```

## Finding services
Service discovery in ADSP is handled using client side service discovery with a directory of services providing a register of available services.

Getting a service URL from the directory:
```python
  from adsp_service_django_sdk import adsp, AdspId

  @require_user()
  def hello_world(request):
    service_url = adsp.directory.get_service_url(AdspId.parse("urn:ads:platform:tenant-service"))
    ...
```

## Handling configuration
Platform services can make use of a common configuration service for managing configuration. The SDK allows services to define their configuration schema and access configuration.

Defining the configuration json schema:
```python
  from adsp_service_django_sdk import AdspRegistration, ConfigurationDefinition


  registration = AdspRegistration(
    "Hello world service",
    "Hello world example for Django",
    configuration=ConfigurationDefinition(
      "Configuration of the hello world sample service.",
      {
        "type": "object",
        "properties": {
          "responses": {
            "type": "object",
            "additionalProperties": {"type": "string"},
          },
        },
      },
    ),
  )
```

Each service can have core configuration that applies across tenants and configuration specific to each tenant. The SDK provides a `get_configuration` function that uses the current service and context tenant.

Getting configuration via the context:
```python
  from adsp_service_django_sdk import adsp


  @require_user()
  def hello_world(request):
    tenant_config, core_config = adsp.get_configuration()
    ...
```

The function uses a configuration service client to retrieve configuration. This is also available from the SDK via dependency injection for direct use.

Getting configuration using the configuration service:
```python
  from adsp_service_django_sdk import adsp



  @require_user()
  def hello_world() -> str:
    tenant_config, core_config = adsp.configuration_service.get_configuration(
      service_id, request_tenant.id
    )
    ...
```

### Converting configuration
Services may want to apply transformations on the retrieved configuration. The SDK allows services to provide functions for combining core and tenant configuration. For example, services can use these to generate effective configuration when tenant overrides parts of core configuration.

Provide conversion functions:
```python
  from adsp_service_django_sdk import AdspRegistration, ConfigurationDefinition


  def convert_config(tenant_config, _) -> Dict[str, Any]:
    return tenant_config


  registration = AdspRegistration(
    "Hello world service",
    "Hello world example for Django",
    configuration=ConfigurationDefinition(
      "Configuration of the hello world sample service.",
        {"type": "object", "properties":{"responses":{"type":"object"}}}
      convert_config,
    )
  )
```

## Registering event definitions, notification types, etc.
The SDK allows services to register configuration for some platform services.

- `roles` defines the client roles of the service. New tenant realms are created with a client that includes the roles specified here.
- `events` defines the domain events of the service signalled for domain significant changes.

Defining configuration for other platform services:
```python
  from adsp_service_django_sdk import (
    AdspRegistration, ConfigurationDefinition, DomainEventDefinition, ServiceRole
  )
  ...

  registration = AdspRegistration(
    display_name="My platform service",
    description="Hello world platform service.",
    roles=[ServiceRole(HELLO_WORLDER, "Role that allows people to hello the world.")],
    events=[
      DomainEventDefinition(
        HELLO_WORLD_EVENT,
        "Signalled when a hello world message is posted to the API.",
        payload_schema={
          "type": "object",
          "properties": {
            "fromUserId": {"type": "string"},
            "fromUser": {"type": "string"},
            "message": {"type": "string"},
            "response": {"type": "string"},
          },
        },
      )
    ]
  )
```

## Sending domain events
Domain events can be sent using the event service.

```python
  import json
  from adsp_service_django_sdk import adsp, DomainEvent


  @require_user()
  def hello_world(request):
    body = json.loads(request.body)
    message = body.get("message", None)
    ...
    adsp.event_service.send(
      DomainEvent(
        HELLO_WORLD_EVENT,
        datetime.utcnow(),
        {
            "fromUserId": get_user.id,
            "fromUser": get_user.name,
            "message": message,
            "response": response,
        },
      )
    )
    ...
```

## Additional utilities
The SDK provides several other useful utilities.

### ADSP ID
Utilities for handling ADSP URNs.

