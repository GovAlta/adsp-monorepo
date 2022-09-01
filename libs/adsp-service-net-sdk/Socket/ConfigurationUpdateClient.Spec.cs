using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using SocketIOClient;
using System.Reactive.Linq;

namespace Adsp.Sdk.Socket;

public class SocketEventSubscriberServiceTests
{
  [Fact]
  public void CanSocketEventSubscriberServiceTests()
  {
    var logger = Mock.Of<ILogger<SocketEventSubscriberService<TPayload, TSubscriber>>>();
    var serviceDirectory = Mock.Of<IServiceDirectory>();
    var tokenProvider = Mock.Of<ITokenProvider>();
    var tenantService = Mock.Of<ITenantService>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
        }
      );

    var service = new ConfigurationUpdateClient(logger, serviceDirectory, tokenProvider, ConfigurationService, tenantService, options.Object);

    service.Should().NotBeNull();
    service.DisposeAsync();
  }

  [Fact]
  public async Task CanConnect()
  {
    var logger = Mock.Of<ILogger<ConfigurationUpdateClient>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var tenantService = Mock.Of<ITenantService>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var options = new Mock<IOptions<AdspOptions>>();
    var testUri = new Uri("https://www.test.com");
    var client = new Mock<SocketIOWrapper>(testUri, new SocketIOOptions());
    var socketResponseAction = new Mock<Action<SocketIOResponse>>();

    Action<object> action = (object obj) =>
                               {
                                 Console.WriteLine("Test");
                               };
    Task t1 = new Task(action, "alpha");

    client
     .Setup(o => o.On("configuration-service:configuration-updated", socketResponseAction.Object));

    client
    .Setup(o => o.DisconnectAsync()).Returns(t1);


    client
      .Setup(o => o.ConnectAsync())
      .Returns(
       t1
      );


    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = null,
        }
      );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://tenant-service/tenants/v2"));

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");
    ConfigurationUpdateClient? service = null;
    try
    {
      service = new ConfigurationUpdateClient(logger, serviceDirectory.Object, tokenProvider.Object, ConfigurationService, tenantService, options.Object,
      client.Object);

      var connection = service.Connect();
      client.Verify((d) => d.ConnectAsync(), Times.Exactly(1));
      client.Verify((d) => d.On("configuration-service:configuration-updated", It.IsAny<Action<SocketIOResponse>>()), Times.Exactly(1));
    }

    finally
    {
      var connection2 = service.DisposeAsync();
    }
  }

  [Fact]
  public async Task CanDisconnect()
  {
    var logger = Mock.Of<ILogger<ConfigurationUpdateClient>>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var tenantService = Mock.Of<ITenantService>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var options = new Mock<IOptions<AdspOptions>>();
    var testUri = new Uri("https://www.test.com");
    var client = new Mock<SocketIOWrapper>(testUri, new SocketIOOptions());
    var socketResponseAction = new Mock<Action<SocketIOResponse>>();

    Action<object> action = (object obj) =>
                               {
                                 Console.WriteLine("Test");
                               };
    Task t1 = new Task(action, "alpha");

    client
     .Setup(o => o.On("configuration-service:configuration-updated", socketResponseAction.Object));

    client
    .Setup(o => o.DisconnectAsync()).Returns(t1);

    client
      .Setup(o => o.Connected()).Returns(true);


    client
      .Setup(o => o.ConnectAsync())
      .Returns(
       t1
      );


    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = null,
        }
      );

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:configuration-service:v2")))
      .ReturnsAsync(new Uri("https://tenant-service/tenants/v2"));

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    ConfigurationUpdateClient? service = null;
    try
    {
      service = new ConfigurationUpdateClient(logger, serviceDirectory.Object, tokenProvider.Object, ConfigurationService, tenantService, options.Object, client.Object);
      var connection = service.Connect();
    }
    finally
    {
      var connection2 = service.DisposeAsync();
      client.Verify((d) => d.DisconnectAsync(), Times.Exactly(1));
    }
  }
}
