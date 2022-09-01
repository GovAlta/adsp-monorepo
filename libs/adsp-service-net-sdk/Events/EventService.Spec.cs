using System.Net;
using Adsp.Sdk.Registration;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using RestSharp;
using RichardSzalay.MockHttp;
using Xunit;


namespace Adsp.Sdk.Events;

public class EventServiceTests
{

  [Fact]
  public void CanCreateEvenService()
  {
    var logger = new Mock<ILogger<EventService>>();
    var registrar = new Mock<IServiceRegistrar>();
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
    using var middleware = new EventService(logger.Object, registrar.Object, serviceDirectory.Object, tokenProvider.Object, options.Object);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public async Task CanSendAnEvent()
  {
    var logger = new Mock<ILogger<EventService>>();
    var registrar = new Mock<IServiceRegistrar>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var domainEvent = new DomainEvent<String>("testEvent", DateTime.Now, "test", "test-co");
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");

    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://directory-service/directory/v2/namespaces/platform/entries")
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
    registrar
      .Setup((d) => d.GetEventDefinition("testEvent"))
      .Returns(new DomainEventDefinition<String>("testEvent", "this is test"));
    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:event-service:v1")))
      .ReturnsAsync(requestBaseUrl);
    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    using var middleware = new EventService(logger.Object, registrar.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    mockHttp.Expect(HttpMethod.Post, "https://event-service/v1/events").Respond(HttpStatusCode.OK);
    await middleware.Send(domainEvent, serviceId);
    mockHttp.VerifyNoOutstandingExpectation();
  }

  [Fact]
  public async Task NoEventDefinitionFoundInvalidOperationException()
  {
    var logger = new Mock<ILogger<EventService>>();
    var registrar = new Mock<IServiceRegistrar>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var domainEvent = new DomainEvent<String>("testEvent", DateTime.Now, "test", "test-co");
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");

    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://directory-service/directory/v2/namespaces/platform/entries")
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
    registrar
      .Setup((d) => d.GetEventDefinition("testEvent"))
      .Returns(null as DomainEventDefinition);
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = serviceId,
        }
      );
    using var middleware = new EventService(logger.Object, registrar.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    InvalidOperationException ex = await Assert.ThrowsAsync<InvalidOperationException>(() => middleware.Send(domainEvent, serviceId));
    ex.Message.Should().Be($"Specified event 'testEvent' is not recognized. Event definition must be registered.");
  }

  [Fact]
  public void NoServiceIdArgumentException()
  {
    var logger = new Mock<ILogger<EventService>>();
    var registrar = new Mock<IServiceRegistrar>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var options = new Mock<IOptions<AdspOptions>>();
    var serviceId = AdspId.Parse("urn:ads:platform:event-service");

    options
      .Setup(o => o.Value)
      .Returns(new AdspOptions { });
    ArgumentException ex = Assert.Throws<ArgumentException>(() =>
    {
      using var middleware = new EventService(logger.Object, registrar.Object, serviceDirectory.Object, tokenProvider.Object, options.Object);
    });
    ex.Message.Should().Contain("Provided options must ADSP service URN value for ServiceId.");
  }

}
