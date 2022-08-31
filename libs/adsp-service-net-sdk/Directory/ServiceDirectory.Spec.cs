using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using Moq;
using RestSharp;
using RichardSzalay.MockHttp;
using Xunit;

namespace Adsp.Sdk.Directory;

public class ServiceDirectoryTests
{
  [Fact]
  public async Task CanGetServiceUrl()
  {
    var logger = Mock.Of<ILogger<ServiceDirectory>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var serviceDirectory = new Mock<IServiceDirectory>();

    var requestBaseUrl = new Uri("https://directory-service/");
    var tenantUrlExpected = new Uri("https://tenant-service/");
    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2");

    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://directory-service/directory/v2/namespaces/platform/entries")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"tenant-service:v2\",\"url\":\"https://tenant-service\",\"urn\":\"urn:ads:platform:tenant-service:v2\"}]"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          DirectoryUrl = requestBaseUrl,
        }
      );
    using var middleware = new ServiceDirectory(logger, cache, options.Object, client);
    var tenantUrl = await middleware.GetServiceUrl(tenantId);
    tenantUrl!.AbsoluteUri.Should().Be(tenantUrlExpected.AbsoluteUri);
  }

  [Fact]
  public async Task NoServiceUrlArgumentException()
  {
    var logger = Mock.Of<ILogger<ServiceDirectory>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var serviceDirectory = new Mock<IServiceDirectory>();

    var requestBaseUrl = new Uri("https://directory-service/");
    var tenantId = AdspId.Parse("urn:ads:platform:test-service:v2");

    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://directory-service/directory/v2/namespaces/platform/entries")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"tenant-service:v2\",\"url\":\"https://tenant-service\",\"urn\":\"urn:ads:platform:tenant-service:v2\"}]"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          DirectoryUrl = requestBaseUrl,
        }
      );
    using var middleware = new ServiceDirectory(logger, cache, options.Object, client);
    ArgumentException ex = await Assert.ThrowsAsync<ArgumentException>(() => middleware.GetServiceUrl(tenantId));
    ex.Message.Should().Be($"No service url for {tenantId}");
  }

  [Fact]
  public void NoDirectoryUrlInOptionsArgumentException()
  {
    var logger = Mock.Of<ILogger<ServiceDirectory>>();
    var serviceDirectory = new Mock<IServiceDirectory>();

    var requestBaseUrl = new Uri("https://directory-service/");
    var tenantId = AdspId.Parse("urn:ads:platform:test-service:v2");

    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When("https://directory-service/directory/v2/namespaces/platform/entries")
      .Respond(
        "application/json",
        "[{\"namespace\":\"platform\",\"service\":\"tenant-service:v2\",\"url\":\"https://tenant-service\",\"urn\":\"urn:ads:platform:tenant-service:v2\"}]"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestBaseUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );
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
      var cache = new MemoryCache(new MemoryCacheOptions());
      using var middleware = new ServiceDirectory(logger, cache, options.Object, client);
    });
    ex.Message.Should().Contain("Provided options must include value for DirectoryUrl.");
  }
}
