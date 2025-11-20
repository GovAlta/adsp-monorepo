using FluentAssertions;
using Xunit;

namespace Adsp.Sdk.Configuration;

public class ConfigurationUpdateTests
{
  [Fact]
  public void ConfigurationUpdateClass()
  {
    var service = new ConfigurationUpdate();

    service.Name = "test";
    service.Namespace = "testNamespace";

    service.Name.Should().Be("test");
    service.Namespace.Should().Be("testNamespace");
  }
}
