---
layout: page
title: Service SDK (.NET 6)
nav_order: 2
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

# ADSP service SDK (.NET 6)
Platform services integrate into the foundational capabilities via a Software Development Kit (SDK). The SDK includes interfaces and utilities for handling tenancy, configurations, and registration. The same SDK can be used for development of tenant services.

Note that the SDK provides friendly interfaces on top of APIs. It is intended to speed up service development but is not the only way to access platform capabilities.

```bash
dotnet add package Adsp.Sdk
```

Use a `nuget.config` file in your project to configure installing from the GitHub packages nuget source:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <packageSources>
        <clear />
        <add key="github" value="https://nuget.pkg.github.com/GovAlta/index.json" />
    </packageSources>
    <packageSourceCredentials>
        <github>
            <add key="Username" value="{github username}" />
            <add key="ClearTextPassword" value="{personal access token}" />
        </github>
    </packageSourceCredentials>
</configuration>
```
Note that the personal access token must be authorized for accessing the enterprise GitHub organization.

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
The SDK follows ASP.NET conventions of extension methods and options pattern. Initialize the SDK by adding ADSP services to the service collection and using capabilities on the application builder. Use `AddAdspForPlatformService` for multi-tenant platform services or `AddAdspForService` for single tenant services.

```csharp
  using Adsp.Sdk;
  ...
  // Bind configuration from the appropriate section.
  var adspConfiguration = builder.Configuration.GetSection("Adsp");
  builder.Services.Configure<AdspOptions>(adspConfiguration);

  builder.Services.AddAdspForPlatformService(
    options =>
    {
      options.ServiceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId"));
      options.DisplayName = "My platform service";
      options.Description = "Hello world platform service.";
    }
  );

  var app = builder.Build();
  app.UseAdsp();
  app.UseAdspMetadata(new AdspMetadataOptions
  {
    SwaggerJsonPath = "docs/v1/swagger.json",
    ApiPath = "script/v1"
  });

  // Use authorization middleware after ADSP in order to use default authentication scheme.
  app.UseAuthorization();
```

## Authorizing requests
The SDK adds [JWT Bearer authentication](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.dependencyinjection.jwtbearerextensions.addjwtbearer?view=aspnetcore-6.0) for verifying JWT bearer tokens in tenant and core realm requests.

The associated schemes are defined in:
```csharp
  public static class AdspAuthenticationSchemes
  {
    public const string Core = "Core";
    public const string Tenant = "Tenant";
  }
```

Authorize by scheme:
```csharp
  [HttpGet]
  [Route("hello")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public string HelloWorld()
  {
    ...
  }
```
When initialized with `AddAdspForService`, the `AdspAuthenticationSchemes.Tenant` is set as the default scheme, and `AuthorizeAttribute` can be used without specifying the scheme.

### Role-based authorization
The SDK maps Keycloak access token `realm_access` and `resource_access` roles to role claims to allow for use of the `AuthorizeAttribute.Roles`.

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
```csharp
  [HttpGet]
  [Route("hello")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant, Roles="other-service:other-user")]
  public string HelloWorld()
  {
    ...
  }
```

Accessing user information directly and checking for role:
```csharp
 var user = HttpContext.GetAdspUser();
 var hasRole = user.IsInRole("other-service:other-user");
```

## Determining tenancy
Requests to platform services are in the context of a specific tenant with few exceptions. The context is implicit when a request is made with a tenant bearer token. It can be explicit in cases where an endpoint allows anonymous access or when a platform service makes a request to another platform service under a core service account.

The SDK includes middleware that resolves implicit from user tenancy and explicit from a `tenantId` query parameter. Resolved tenant is set on the request object; no value is set if tenancy cannot be resolved.

Getting tenancy from the context:
```csharp
  using Adsp.Sdk;
  public class HelloWorldController : ControllerBase
  {
    private readonly ITenantService _tenantService;
    public HelloWorldController(ITenantService tenantService)
    {
      _tenantService = tenantService;
    }

    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string tenantId)
    {
      var tenant = await HttpContext.GetTenant();
      ...
    }
  }
```

The handler uses the tenant service client to retrieve tenant information. This is also available from the SDK for direct use.

The tenant service is available via dependency injection.

Getting tenant information using the tenant service:
```csharp
  using Adsp.Sdk;
  public class HelloWorldController : ControllerBase
  {
    private readonly ITenantService _tenantService;
    public HelloWorldController(ITenantService tenantService)
    {
      _tenantService = tenantService;
    }

    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string tenantId)
    {
      var tenant = await _tenantService.GetTenant(AdspId.Parse(tenantId));
      ...
    }
  }
```

## Finding services
Service discovery in ADSP is handled using client side service discovery with a directory of services providing a register of available services.

Getting a service URL from the directory:
```csharp
  using Adsp.Sdk;
  public class HelloWorldController : ControllerBase
  {
    private readonly IServiceDirectory _directory;
    public HelloWorldController(IServiceDirectory directory)
    {
      _directory = directory;
    }

    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string serviceId)
    {
      var serviceUrl = await _directory.GetServiceUrl(AdspId.Parse(serviceId));
      ...
    }
  }
```

## Handling configuration
Platform services can make use of a common configuration service for managing configuration. The SDK allows services to define their configuration schema and access configuration.

Defining the configuration json schema:
```csharp
  builder.Services.AddAdspForPlatformService(
    options =>
    {
      ...
      options.Configuration = new ConfigurationDefinition<HelloConfiguration>(
        "Configuration of the hello world service.",
      );
    }
  );
```

Each service can have core configuration that applies across tenants and configuration specific to each tenant. The SDK provides a configuration HttpContext extension method that will retrieve configuration in request tenant context. The tenant context is determined using `HttpContext.GetTenant()`.

Getting configuration via the context:
```csharp
  using Adsp.Sdk;
  public class HelloWorldController : ControllerBase
  {
    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string serviceId)
    {
      var (tenantConfig, coreConfig) = await HttpContext.GetConfiguration<HelloConfiguration>();
      ...
    }
  }
```

The handler uses configuration service client to retrieve configuration. This is also available from the SDK via dependency injection for direct use.

Getting configuration using the configuration service:
```csharp
  using Adsp.Sdk;
  public class HelloWorldController : ControllerBase
  {
    private readonly IConfigurationService _configurationService;
    public HelloWorldController(IConfigurationService configurationService)
    {
      _configurationService = configurationService;
    }

    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string serviceId, string tenantId)
    {
      var (tenantConfig, coreConfig) =
        await _configurationService.GetConfiguration<HelloConfiguration>(
          AdspId.Parse(serviceId),
          AdspId.Parse(tenantId)
        );
      ...
    }
  }
```

### Converting configuration
Services may want to apply transformations on the retrieved configuration. The SDK allows services to provide functions for combining core and tenant configuration. For example, services can use these to generate effective configuration when tenant overrides parts of core configuration.

Provide conversion functions:
```csharp
  builder.Services.AddAdspForPlatformService(
    options =>
    {
      ...
      options.Configuration = new ConfigurationDefinition<HelloConfiguration>(
        "Configuration of the hello world service.",
        (tenantConfig, coreConfig) => { return tenantConfig + coreConfig; }
      );
    }
  );
```

Use the second generic parameter of `GetConfiguration` for the type of the combined configuration object.

## Registering event definitions, notification types, etc.
The SDK allows services to register configuration for some platform services.

- `Roles` defines the client roles of the service. New tenant realms are created with a client that includes the roles specified here.
- `Events` defines the domain events of the service signalled for domain significant changes.
- `EventsStreams` defines the event streams of the service that allow clients to access events via the push service.
- `FileTypes` defines the file types of the service.

Defining configuration for other platform services:
```csharp
  builder.Services.AddAdspForPlatformService(
    options =>
    {
      options.Roles = new[] {
        new ServiceRole {
          Role = ServiceRoles.HelloWorlder,
          Description = "Role that allows people to hello the world.",
          InTenantAdmin = true
        }
      };
      options.Events = new[] {
        new DomainEventDefinition<HelloWorldExecuted>(
          HelloWorldExecuted.EventName,
          "Signalled when hello world is executed."
        )
      };
      options.EventStreams = new[] {
        new StreamDefinition("hello-updates", "Hello updates") {
          SubscriberRoles = new[] {
            $"{serviceId}:{ServiceRoles.HelloWorlder}" // prefix the role since it is verified by push service.
          },
          Events = new[] {
            new StreamDefinitionEvent(serviceId.Service, HelloWorldExecuted.EventName)
          }
        }
      }
      options.FileTypes = new[] {
        new FileType("hello-files", "Hello files")
      }
    }
  );
```

## Sending domain events
Domain events can be sent using the event service which is available via dependency injection.

```csharp
  using Adsp.Sdk;
  public class HelloWorldController : ControllerBase
  {
    private readonly IEventService _eventService;
    public HelloWorldController(IEventService eventService)
    {
      _eventService = eventService;
    }

    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string message)
    {
      ...
      await _eventService.Send(
        new DomainEvent<HelloWorldExecuted>(
          HelloWorldExecuted.EventName,
          DateTime.Now,
          new HelloWorldExecuted { Message = message }
        )
      );
    }
  }
```

## Connecting to push streams
Services can receive events via push service streams over [Socket.IO](https://socket.io).

Implement the `IEventSubscriber<TPayload>` interface to create a subscriber.
```csharp
  using Adsp.Sdk.Events;
  public class MyEventSubscriber : IEventSubscriber<IDictionary<string, object?>>
  {
    public Task OnEvent(FullDomainEvent<IDictionary<string, object?>> received)
    {
      ...
    }
  }
```

Add the subscriber the service container via `AddSocketSubscriber` extension methods to connect on service startup.
```csharp
  using Adsp.Sdk.Socket;
  ...
  builder.Services.AddSocketSubscriber<MyEventSubscriber>("my-event-stream");
```

## Recording service metrics
The SDK includes utilities for micro-benchmarking service operations and recording the results to the value service.

Add the required middleware to the application builder to instrument the request handling. This middleware should be added early to account for the full operation duration.

```csharp
  var app = builder.Build();
  app.UseAdspMetrics();
  ...
  app.UseAdsp();
```

Use the metrics extensions to benchmark specific sections of operations.
```csharp
  using Adsp.Sdk.Metrics;
  public class HelloWorldController : ControllerBase
  {
    [HttpGet]
    [Route("hello")]
    public async Task<string> HelloWorld(string message)
    {
      using (HttpContext.Benchmark("hello-world-time"))
      {
        ...
      }
    }
  }
```

Register the service metrics value definition to access metrics from tenant administration. Metrics with the `-time` suffix are stacked to show the components of the total response time.

```csharp
  builder.Services.AddAdspForPlatformService(
    options =>
    {
      options.ServiceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId"));
      ...
      options.Values = new ValueDefinition[] {
        ServiceMetrics.Definition
      }
    }
  );
```

Raw metrics and values can be accessed via the value service API.

## Additional utilities
The SDK provides several other useful utilities.

### ADSP ID
Utilities for handling ADSP URNs.

### Platform health check

### Errors and error handler

