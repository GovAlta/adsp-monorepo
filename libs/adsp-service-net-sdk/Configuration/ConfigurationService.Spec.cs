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

public class ConfigurationServiceTests
{
  [Fact]
  public void CanCreateConfigurationService()
  {
    var logger = Mock.Of<ILogger<ConfigurationService>>();
    var cache = Mock.Of<IMemoryCache>();
    var serviceDirectory = Mock.Of<IServiceDirectory>();
    var tokenProvider = Mock.Of<ITokenProvider>();
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

    var service = new ConfigurationService(logger, cache, serviceDirectory, tokenProvider, options.Object);
    service.Should().NotBeNull();
    service.Dispose();
  }

  [Fact]
  public async Task CanRetrieveConfiguration()
  {
    var logger = Mock.Of<ILogger<ConfigurationService>>();
    var cache = new Mock<IMemoryCache>();
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var options = new Mock<IOptions<AdspOptions>>();
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

    object? whatever;

    cache
      .Setup(mc => mc.TryGetValue(It.IsAny<object>(), out whatever))
      .Returns(null);

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    var requestUrl = new Uri("https://tenant-service/tenants/v2/configuration/test/test-service/latest");

    using var mockHttp = new MockHttpMessageHandler();

    var jsonstring = "{\"Platform:configuration-service\":{\"configurationSchema\":{\"asdf\":\"dfd343434fdf\",\"Hello\":\"WORLD QQQQQQQQQQQQ\"},\"description\":\"aaaaabbbface\"}}";

    var mockedHttpResponse = JObject.Parse(jsonstring).ToString(Newtonsoft.Json.Formatting.None);

    mockHttp
    .When(HttpMethod.Get, requestUrl.AbsoluteUri)
        .Respond(
          "application/json",
          jsonstring
        );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    var serviceId = AdspId.Parse("urn:ads:test:test-service");
    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    using (var service = new ConfigurationService(logger, cache.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client))
    {
      var (tenant, core) = await service.GetConfiguration<object>(serviceId, tenantId);
      tenant?.ToString().Should().BeEquivalentTo(mockedHttpResponse);
      core?.ToString().Should().BeEquivalentTo(mockedHttpResponse);
    }
  }
}
