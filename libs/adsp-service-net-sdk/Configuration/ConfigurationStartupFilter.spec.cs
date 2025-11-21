using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using Microsoft.AspNetCore.Builder;

namespace Adsp.Sdk.Configuration;

public class ConfigurationStartupFilterTests
{
  [Fact]
  public void CanCreateConfigurationService()
  {
    var client = Mock.Of<IConfigurationUpdateClient>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
        }
      );

    var service = new ConfigurationStartupFilter(client, options.Object);
    service.Should().NotBeNull();
  }

  [Fact]
  public void CanConnectClient()
  {
    var client = new Mock<IConfigurationUpdateClient>();
    var options = new Mock<IOptions<AdspOptions>>();
    var appBuilderAction = new Mock<Action<IApplicationBuilder>>();
    var appBuilder = new Mock<IApplicationBuilder>();

    options
    .Setup(o => o.Value)
    .Returns(
      new AdspOptions
      {
        EnableConfigurationInvalidation = true,
      }
    );

    var service = () => new ConfigurationStartupFilter(client.Object, options.Object);

    Action<IApplicationBuilder> doWork = service().Configure(appBuilderAction.Object);

    doWork(appBuilder.Object);

    client.Verify((d) => d.Connect(), Times.Exactly(1));
  }
}
