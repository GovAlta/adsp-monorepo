using FluentAssertions;
using Microsoft.Extensions.Logging;
using Adsp.Sdk.Events;
using Moq;
using Xunit;

namespace Adsp.Sdk.Configuration;

public class ConfigurationUpdateClientTests
{
  [Fact]
  public void CanConfigurationUpdateClientTests()
  {
    var logger = Mock.Of<ILogger<ConfigurationUpdateClient>>();
    var ConfigurationService = Mock.Of<IConfigurationService>();

    var service = new ConfigurationUpdateClient(logger, ConfigurationService);

    service.Should().NotBeNull();
  }

  [Fact]
  public void CanOnEvent()
  {
    var logger = Mock.Of<ILogger<ConfigurationUpdateClient>>();
    var configurationService = new Mock<IConfigurationService>();

    ConfigurationUpdateClient? service = null;
    service = new ConfigurationUpdateClient(logger, configurationService.Object);
    var configUpdate = new ConfigurationUpdate();
    configUpdate.Name = "configuration-updated";
    configUpdate.Namespace = "configuration-service";
    var fullDomainConfigUpdate = new FullDomainEvent<ConfigurationUpdate>(AdspId.Parse("urn:ads:test:test-service"), "configuration-service", "configuration-updated", new DateTime(), configUpdate);

    var connection = service.OnEvent(fullDomainConfigUpdate);
    configurationService.Verify((d) => d.ClearCached(AdspId.Parse($"urn:ads:{configUpdate.Namespace}:{configUpdate.Name}"), fullDomainConfigUpdate.TenantId), Times.Exactly(1));
  }
}
