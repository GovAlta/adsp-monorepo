using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using RestSharp;
using Microsoft.Extensions.Options;
using RichardSzalay.MockHttp;
using Moq;
using Xunit;
using Newtonsoft.Json.Linq;

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
