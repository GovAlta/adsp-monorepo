# adsp-service-net-sdk

ADSP Software Development Kit (SDK) for rapid development of ADSP platform and tenant services in ASP.NET Core.
This SDK includes components like utilities, middleware, and clients to support development of services.
It follows ASP.NET Core conventions and provides an opinionated framework for using ADSP capabilities.

## Installation

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

## Getting started

Initialize the SDK for either platform or tenant service using extension methods and the options pattern.

### For multi-tenant platform services

```csharp
using Adsp.Sdk;

var builder = WebApplication.CreateBuilder(args);

// Bind configuration from the appropriate section
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

// Use authorization middleware after ADSP to use default authentication scheme
app.UseAuthorization();

app.Run();
```

### For single-tenant services

```csharp
using Adsp.Sdk;

var builder = WebApplication.CreateBuilder(args);

var adspConfiguration = builder.Configuration.GetSection("Adsp");
builder.Services.Configure<AdspOptions>(adspConfiguration);

builder.Services.AddAdspForService(
  options =>
  {
    options.ServiceId = AdspId.Parse(adspConfiguration.GetValue<string>("ServiceId"));
    options.DisplayName = "My tenant service";
    options.Description = "Hello world tenant service.";
  }
);

var app = builder.Build();
app.UseAdsp();
app.UseAuthorization();

app.Run();
```

### Configuration (appsettings.json)

```json
{
  "Adsp": {
    "ServiceId": "urn:ads:platform:my-service",
    "AccessServiceUrl": "https://access.adsp.alberta.ca",
    "DirectoryUrl": "https://directory.adsp.alberta.ca",
    "ClientSecret": "<service-account-secret>",
    "Realm": "my-tenant"
  }
}
```

## Key Features

### Authorization

Authorize requests using JWT Bearer authentication:

```csharp
[HttpGet]
[Route("hello")]
[Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
public string HelloWorld()
{
  var user = HttpContext.GetAdspUser();
  var hasRole = user.IsInRole("my-service:my-role");
  ...
}
```

### Tenant Context

Resolve tenant context from requests:

```csharp
[HttpGet]
[Route("hello")]
public async Task<string> HelloWorld()
{
  var tenant = await HttpContext.GetTenant();
  ...
}
```

### Configuration

Define and retrieve service configuration:

```csharp
// Define configuration schema
builder.Services.AddAdspForPlatformService(
  options =>
  {
    options.Configuration = new ConfigurationDefinition<MyConfiguration>(
      "Configuration of my service."
    );
  }
);

// Retrieve configuration
var (tenantConfig, coreConfig) = await HttpContext.GetConfiguration<MyConfiguration>();
```

### Domain Events

Send domain events:

```csharp
public class MyController : ControllerBase
{
  private readonly IEventService _eventService;

  public MyController(IEventService eventService)
  {
    _eventService = eventService;
  }

  [HttpPost]
  public async Task<IActionResult> DoSomething()
  {
    await _eventService.Send(
      new DomainEvent<MyEventPayload>(
        "my-event",
        DateTime.Now,
        new MyEventPayload { ... }
      )
    );
    return Ok();
  }
}
```

### Service Discovery

Find other services via the directory:

```csharp
public class MyController : ControllerBase
{
  private readonly IServiceDirectory _directory;

  public MyController(IServiceDirectory directory)
  {
    _directory = directory;
  }

  [HttpGet]
  public async Task<IActionResult> CallOtherService()
  {
    var serviceUrl = await _directory.GetServiceUrl(
      AdspId.Parse("urn:ads:platform:other-service:v1")
    );
    ...
  }
}
```

### Service Metadata

Enable service metadata for directory integration:

```csharp
app.UseAdspMetadata(new AdspMetadataOptions
{
  SwaggerJsonPath = "docs/v1/swagger.json",
  ApiPath = "my-service/v1"
});
```

### Metrics

Record service metrics:

```csharp
app.UseAdspMetrics();

// In controller
using (HttpContext.Benchmark("my-operation-time"))
{
  // Timed operation
}
```

See [ADSP Development Guide](https://govalta.github.io/adsp-monorepo) for details.
