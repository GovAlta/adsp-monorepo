using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using RestSharp;
using RichardSzalay.MockHttp;
using Xunit;


namespace Adsp.Sdk.Registration;

public class ServiceRegistrarTests
{
  [Fact]
  public void CanCreateServiceRegistrar()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");

    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public async Task CanUpdateConfigConfiguration()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://configuration-service/v2/configuration/platform/configuration-service")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"event-service\",\"url\":\"https://event-service\",\"urn\":\"urn:ads:platform:event-service\"}]"
      );
    var requestBaseUrl = new Uri("https://event-service/");
    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://configuration-service/"));

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    var registration = new ServiceRegistration();
    registration.Configuration =
      new ConfigurationDefinition<string>(
        "Configuration of the hello world service."
    );
    using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    await middleware.Register(registration);
  }

  [Fact]
  public async Task CanUpdateEventConfiguration()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://configuration-service/v2/configuration/platform/configuration-service")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"event-service\",\"url\":\"https://event-service\",\"urn\":\"urn:ads:platform:event-service\"}]"
      );
    var requestBaseUrl = new Uri("https://event-service/");
    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://configuration-service/"));
    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    var registration = new ServiceRegistration();
    registration.Events = new[] {
        new DomainEventDefinition<string>(
          "test event name",
          "Signalled when hello world is executed."
        )
      };
    using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    await middleware.Register(registration);
  }

  [Fact]
  public async Task CanUpdateRolesConfiguration()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://configuration-service/v2/configuration/platform/configuration-service")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"event-service\",\"url\":\"https://event-service\",\"urn\":\"urn:ads:platform:event-service\"}]"
      );
    var requestBaseUrl = new Uri("https://event-service/");
    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://configuration-service/"));
    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");
    //"https://configuration-service/v2/configuration/platform/configuration-service"
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    var registration = new ServiceRegistration();
    registration.Roles = new[] {
        new ServiceRole {
          Role = "test role",
          Description = "Role that allows people to hello the world.",
          InTenantAdmin = true
        }
      };
    using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    await middleware.Register(registration);
  }

  [Fact]
  public async Task CanUpdateEventStreamsConfiguration()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://configuration-service/v2/configuration/platform/configuration-service")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"event-service\",\"url\":\"https://event-service\",\"urn\":\"urn:ads:platform:event-service\"}]"
      );
    var requestBaseUrl = new Uri("https://event-service/");
    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://configuration-service/"));
    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    var registration = new ServiceRegistration();
    registration.EventStreams = new[] {
        new StreamDefinition("hello-updates", "Hello updates") {
          SubscriberRoles = new[] {
            $"{serviceId}:test"
          }
        }
      };
    using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    await middleware.Register(registration);
  }

  [Fact]
  public void WillThrowArgumentExceptionWithMissingServiceIdOption()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();

    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
        }
      );
    ArgumentException ex = Assert.Throws<ArgumentException>(() =>
    {
      using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object);
    });
    ex.Message.Should().Contain("Provided options must include value for ServiceId.");
  }

  [Fact]
  public async Task CanUpdateFileTypesConfiguration()
  {
    var logger = new Mock<ILogger<ServiceRegistrar>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://configuration-service/v2/configuration/platform/configuration-service")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"event-service\",\"url\":\"https://event-service\",\"urn\":\"urn:ads:platform:event-service\"}]"
      );
    var requestBaseUrl = new Uri("https://event-service/");
    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://configuration-service/"));
    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    var registration = new ServiceRegistration();
    registration.FileTypes = new[] {
        new FileType("hello-files", "Hello files")
      };
    using var middleware = new ServiceRegistrar(logger.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    await middleware.Register(registration);
  }

}
