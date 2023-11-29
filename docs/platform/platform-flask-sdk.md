---
layout: page
title: Service SDK (Flask)
nav_order: 5
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

# ADSP service SDK (Flask)
Platform services integrate into the foundational capabilities via a Software Development Kit (SDK). The SDK includes interfaces and utilities for handling tenancy, configurations, and registration. The same SDK can be used for development of tenant services.

Note that the SDK provides friendly interfaces on top of APIs. It is intended to speed up service development but is not the only way to access platform capabilities.

Install the ADSP SDK for Flask wheel from release artifacts in the repository.

```bash
poetry add https://github.com/GovAlta/adsp-monorepo/releases/download/adsp-service-flask-sdk-v1.3.1/adsp_service_flask_sdk-1.0.0-py3-none-any.whl
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
The SDK includes a Flask Extension, Blueprint, and context proxies. Create the extension and initialize on the Flask app to get started.

```python
  from adsp import AdspExtension, AdspRegistration
  from flask import Flask

  app = Flask(__name__)
  extension = AdspExtension()
  extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service."
    )
  )
```

## Enabling service metadata
The service directory aggregates service metadata from the root resource of services registered in the directory. This metadata is used to simplify configuration and for OpenAPI documentation aggregation at https://api.adsp.alberta.ca/{tenant}. SDK includes components for exposing the metadata endpoint.

Enabling service metadata:
```python
  from adsp import AdspExtension, AdspRegistration
  from flask import Flask

  app = Flask(__name__)
  extension = AdspExtension()
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service.",
      api_path="/hello-world/v1"
    )
  )

  app.register_blueprint(adsp.metadata_blueprint)
```

## Authorizing requests
The SDK extension adds a `before_request` function to process access tokens. It provides a `request_user` context value and `require_user` decorator for authorizing requests.

Require ADSP user for request:
```python
  from adsp_service_flask_sdk import request_user, require_user, User
  ...

  @app.route("hello-world/v1/hello")
  @require_user()
  def hello_world() -> str:
    return f"hello {request_user.name}"
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
  from adsp_service_flask_sdk import request_user, require_user, User
  ...

  @app.route("hello-world/v1/hello")
  @require_user("other-service:other-user")
  def hello_world() -> str:
    return f"hello {request_user.name}"
```

Accessing user information directly and checking for role:
```python
  from adsp_service_flask_sdk import request_user

  has_role = "other-service:other-user" in request_user.roles
```

## Determining tenancy
Requests to platform services are in the context of a specific tenant with few exceptions. The context is implicit when a request is made with a tenant bearer token. It can be explicit in cases where an endpoint allows anonymous access or when a platform service makes a request to another platform service under a core service account.

The SDK extension adds a `before_request` function that resolves implicit tenancy from user tenancy and explicit from a `tenantId` query parameter. Resolved tenant is set on the request object; no value is set if tenancy cannot be resolved.

Getting tenancy from the context:
```python
  from adsp_service_flask_sdk import request_tenant
  ...

  @app.route("hello-world/v1/hello")
  @require_user()
  def hello_world() -> str:
    return f"hello {request_tenant.name}"
```

The handler uses the tenant service client to retrieve tenant information. This is also available from the SDK for direct use. The tenant service is available via dependency injection.

Getting tenant information using the tenant service:
```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service."
    )
  )

  @app.route("hello-world/v1/hello")
  @require_user()
  def hello_world() -> str:
    tenant_id = request.args.get("tenantId")
    tenant = adsp.tenant_service.get_tenant(AdspId.parse(tenant_id))
    ...
```

## Finding services
Service discovery in ADSP is handled using client side service discovery with a directory of services providing a register of available services.

Getting a service URL from the directory:
```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service."
    )
  )

  @app.route("hello-world/v1/hello")
  @require_user()
  def hello_world() -> str:
    service_url = adsp.directory.get_service_url(AdspId.parse("urn:ads:platform:tenant-service"))
    ...
```

## Handling configuration
Platform services can make use of a common configuration service for managing configuration. The SDK allows services to define their configuration schema and access configuration.

Defining the configuration json schema:
```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service.",
      configuration=ConfigurationDefinition(
        "Configuration of messages.",
        {"type": "object", "properties":{"responses":{"type":"object"}}}
      )
    )
  )
```

Each service can have core configuration that applies across tenants and configuration specific to each tenant. The SDK provides a `get_configuration` function that uses the current service and context tenant.

Getting configuration via the context:
```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service.",
      configuration=ConfigurationDefinition(
        "Configuration of messages.",
        {"type": "object", "properties":{"responses":{"type":"object"}}}
      )
    )
  )

  @app.route("hello-world/v1/hello")
  @require_user()
  def hello_world() -> str:
    tenant_config, core_config = adsp.get_configuration()
    ...
```

The function uses a configuration service client to retrieve configuration. This is also available from the SDK via dependency injection for direct use.

Getting configuration using the configuration service:
```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service.",
      configuration=ConfigurationDefinition(
        "Configuration of messages.",
        {"type": "object", "properties":{"responses":{"type":"object"}}}
      )
    )
  )

  @app.route("hello-world/v1/hello")
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
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service.",
      configuration=ConfigurationDefinition(
        "Configuration of messages.",
        {"type": "object", "properties":{"responses":{"type":"object"}}}
        lambda tenant_config, core_config: core_config.update(tenant_config.items())
      )
    )
  )
```

## Registering event definitions, notification types, etc.
The SDK allows services to register configuration for some platform services.

- `roles` defines the client roles of the service. New tenant realms are created with a client that includes the roles specified here.
- `events` defines the domain events of the service signalled for domain significant changes.

Defining configuration for other platform services:
```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
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
  )
```

## Sending domain events
Domain events can be sent using the event service.

```python
  adsp = extension.init_app(
    app,
    AdspRegistration(
      display_name="My platform service",
      description="Hello world platform service.",
      roles=[ServiceRole(HELLO_WORLDER, "Role that allows people to hello the world.")],
      events=[
        DomainEventDefinition(
          HELLO_WORLD_EVENT,
          "Signalled when a hello world message is posted to the API.",
          payload_schema={
            ...
          },
        )
      ]
    )
  )

  @app.route("hello-world/v1/hello")
  @require_user()
  def hello_world() -> str:
    message = request.args.get("message")
    ...
    adsp.event_service.send(
      DomainEvent(
        HELLO_WORLD_EVENT,
        datetime.utcnow(),
        {
            "fromUserId": request_user.id,
            "fromUser": request_user.name,
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

