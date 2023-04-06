---
layout: page
title: Service SDK (Spring)
nav_order: 4
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

# ADSP service SDK (Spring)
Platform services integrate into the foundational capabilities via a Software Development Kit (SDK). The SDK includes interfaces and utilities for handling tenancy, configurations, and registration. The same SDK can be used for development of tenant services.

Note that the SDK provides friendly interfaces on top of APIs. It is intended to speed up service development but is not the only way to access platform capabilities.

Package [adsp-service-spring-sdk](https://github.com/GovAlta/adsp-monorepo/packages/1657803)

```xml
<dependency>
  <groupId>ca.ab.gov.alberta.adsp</groupId>
  <artifactId>adsp-service-spring-sdk</artifactId>
  <version>1.2.0</version>
</dependency>
```

Update maven `settings.xml` file to configure installing from the GitHub packages maven repository:

```xml
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0
                      http://maven.apache.org/xsd/settings-1.0.0.xsd">
  <activeProfiles>
    <activeProfile>github</activeProfile>
  </activeProfiles>
  <profiles>
    <profile>
      <id>github</id>
      <repositories>
        <repository>
          <id>github</id>
          <url>https://maven.pkg.github.com/GovAlta/adsp-monorepo</url>
        </repository>
        ...
      </repositories>
    </profile>
  </profiles>
  <servers>
    <server>
      <id>github</id>
      <username>{github username}</username>
      <password>{personal access token}</password>
    </server>
  </servers>
</settings>
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
The SDK follows Spring conventions of using annotations to enable capabilities as well as Spring Boot conventions for auto-configuration. For Spring, add the `@EnableAdsp` annotation to configuration. For Spring Boot, customize configuration by extending `AdspConfigurationSupport` and auto-configuration will apply SDK capabilities.

```java
  public class MyAdspConfiguration extends AdspConfigurationSupport {
    @Override
    protected Builder customize(Builder builder) {
      return builder.withDisplayName("My platform service")
        .withDescription("Hello world platform service.");
    }
  }
```

By default properties of `AdspConfiguration` are fulfilled with application properties with an `adsp` prefix. (e.g. `adsp.accessServiceUrl`)

## Enabling service metadata
The service directory aggregates service metadata from the root resource of services registered in the directory. This metadata is used to simplify configuration and for OpenAPI documentation aggregation at https://api.adsp.alberta.ca/{tenant}. SDK includes components for exposing the metadata endpoint.

Enabling service metadata:
```java
  @Configuration
  public class HelloWorldMetadata extends AdspMetadataSupport {
    @Override
    protected Builder customize(Builder builder) {
      return builder.withApiPath("/hello-world/v1");
    }
  }
```

## Authorizing requests
The SDK provides the `SecurityFilterChain` bean for verifying JWT bearer tokens in tenant requests. By default, the authentication is applied with an ant pattern of `**/v?/**`, and services can modify the patterns on `AdspConfiguration`.

### Role-based authorization
The SDK maps Keycloak access token `realm_access` and `resource_access` roles to granted role authorities to allow for use of authorization annotations.

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
```java
  @PreAuthorize("hasRole('other-service:other-user')")
  @GetMapping("/hello")
  public String helloWorld() {
    ...
  }
```

Accessing user information directly and checking for role:
```java
 var user = AdspRequestContextHolder.current().getUser();
 var hasRole = user.isInRole("other-service:other-user");
```

## Determining tenancy
Requests to platform services are in the context of a specific tenant with few exceptions. The context is implicit when a request is made with a tenant bearer token. It can be explicit in cases where an endpoint allows anonymous access or when a platform service makes a request to another platform service under a core service account.

The SDK includes middleware that resolves implicit from user tenancy and explicit from a `tenantId` query parameter. Resolved tenant is set on the request object; no value is set if tenancy cannot be resolved.

Getting tenancy from the context:
```java
  import ca.ab.gov.alberta.adsp.sdk.AdspRequestContextHolder;

  @RestController
  public class HelloWorldController {
    @GetMapping("/hello")
    public String helloWorld() {
      var tenant = AdspRequestContextHolder.current().getTenant().blockOptional();
      ...
    }
  }
```

The handler uses the tenant service client to retrieve tenant information. This is also available from the SDK for direct use. The tenant service is available via dependency injection.

Getting tenant information using the tenant service:
```java
  import ca.ab.gov.alberta.adsp.sdk.AdspId;
  import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;

  @RestController
  public class HelloWorldController {
    private final TenantService tenantService;
    public HelloWorldController(TenantService tenantService) {
      this.tenantService = tenantService;
    }

    @GetMapping("/hello")
    public String helloWorld(String tenantId) {
      var tenant = this.tenantService.getTenant(AdspId.parse(tenantId)).blockOptional();
      ...
    }
  }
```

## Finding services
Service discovery in ADSP is handled using client side service discovery with a directory of services providing a register of available services.

Getting a service URL from the directory:
```java
  import ca.ab.gov.alberta.adsp.sdk.AdspId;
  import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;

  @RestController
  public class HelloWorldController {
    private final ServiceDirectory directory;
    public HelloWorldController(ServiceDirectory directory) {
      this.directory = directory;
    }

    @GetMapping("/hello")
    public String helloWorld(String serviceId)
    {
      var serviceUrl = this.directory.getServiceUrl(AdspId.parse(serviceId)).blockOptional();
      ...
    }
  }
```

## Handling configuration
Platform services can make use of a common configuration service for managing configuration. The SDK allows services to define their configuration schema and access configuration.

Defining the configuration json schema:
```java
  import ca.ab.gov.alberta.adsp.sdk.registration.ConfigurationDefinition;
  ...
    @Override
    protected Builder customize(Builder builder) {
      return builder.register(
        registration -> registration.withConfiguration(
          new ConfigurationDefinition<HelloConfiguration>("Configuration of the hello world service.") {
        })
      )
    }
```

Each service can have core configuration that applies across tenants and configuration specific to each tenant. The SDK provides a configuration HttpContext extension method that will retrieve configuration in request tenant context. The tenant context is determined using `AdspRequestContextHolder.current().getTenant()`.

Getting configuration via the context:
```java
  import ca.ab.gov.alberta.adsp.sdk.AdspRequestContextHolder;

  @RestController
  public class HelloWorldController {

    @GetMapping("/hello")
    public String helloWorld()
    {
      var configuration = AdspRequestContextHolder.current()
        .getConfiguration(HelloConfiguration.TypeReference)
        .blockOptional();
      ...
    }
  }
```

The handler uses configuration service client to retrieve configuration. This is also available from the SDK via dependency injection for direct use.

Getting configuration using the configuration service:
```java
  import ca.ab.gov.alberta.adsp.sdk.AdspId;
  import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;

  @RestController
  public class HelloWorldController {
    private final ConfigurationService configurationService;
    public HelloWorldController(ConfigurationService configurationService) {
      this.configurationService = configurationService;
    }

    @GetMapping("/hello")
    public String helloWorld(String serviceId, String tenantId)
    {
      var serviceUrl = this.configurationService.getConfiguration(AdspId.parse(serviceId), Optional.of(AdspId.parse(tenantId)), HelloConfiguration.TypeReference)
        .blockOptional();
      ...
    }
  }
```


## Registering event definitions, notification types, etc.
The SDK allows services to register configuration for some platform services.

- `Roles` defines the client roles of the service. New tenant realms are created with a client that includes the roles specified here.
- `Events` defines the domain events of the service signalled for domain significant changes.

Defining configuration for other platform services:
```java
  import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;
  import ca.ab.gov.alberta.adsp.sdk.registration.ServiceRole;
  ...
    @Override
    protected Builder customize(Builder builder) {
      return builder.register(
        registration -> registration.withRoles(
            new ServiceRole(
              ServiceRoles.HelloWorlder,
              "Role that allows people to hello the world.",
              true))
          .withEvents(
            new DomainEventDefinition<HelloWorldExecuted>(HelloWorldExecuted.EventName,
              "Signalled when hello world is executed.") {
          }));
    }
```

## Sending domain events
Domain events can be sent using the event service which is available via dependency injection.

```java
  import ca.ab.gov.alberta.adsp.sdk.AdspId;
  import ca.ab.gov.alberta.adsp.sdk.events.DomainEvent;
  import ca.ab.gov.alberta.adsp.sdk.events.EventService;

  @RestController
  public class HelloWorldController {
    private final EventService eventService;
    public HelloWorldController(EventService eventService) {
      this.eventService = eventService;
    }

    @GetMapping("/hello")
    public String helloWorld(String message)
    {
      this.eventService.send(new DomainEvent<HelloWorldExecuted>(
        HelloWorldExecuted.EventName,
        Instant.now(),
        new HelloWorldExecuted(message)
      )).blockOptional();
      ...
    }
  }
```

## Connecting to push streams
Services can receive events via push service streams over [Socket.IO](https://socket.io).

Create a POJO component / bean with the `SocketEventListener` annotation on an appropriate method.
```java

  @Component
  public class MyEventSubscriber {
    @SocketEventListener(streamId = "my-event-stream", payloadType = Map.class)
    public void onEvent(FullDomainEvent<Map<String, Object>> received) {
      ...
    }
  }
```


## Additional utilities
The SDK provides several other useful utilities.

### ADSP ID
Utilities for handling ADSP URNs.
