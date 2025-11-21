using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using RestSharp;
using RichardSzalay.MockHttp;
using Xunit;

namespace Adsp.Sdk.Tenancy;

public class TenantServiceTests
{
  [Fact]
  public void CanCreateTenantService()
  {
    var logger = Mock.Of<ILogger<TenantService>>();
    var cache = Mock.Of<IMemoryCache>();
    var serviceDirectory = Mock.Of<IServiceDirectory>();
    var tokenProvider = Mock.Of<ITokenProvider>();
    var client = Mock.Of<IRestClient>();

    using var middleware = new TenantService(logger, cache, serviceDirectory, tokenProvider, client);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public async Task CanGetTenants()
  {
    var logger = Mock.Of<ILogger<TenantService>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:tenant-service:v2")))
      .ReturnsAsync(new Uri("https://tenant-service/tenants/v2"));

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");

    var requestUrl = new Uri("https://tenant-service/tenants/v2/tenants");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When(HttpMethod.Get, requestUrl.AbsoluteUri)
      .Respond(
        "application/json",
        "{\"results\":[{\"id\": \"urn:ads:platform:tenant-service:v2:/tenants/test\", \"name\": \"test\", \"realm\": \"test\", \"adminEmail\": \"tester@test.co\" }]}"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );
    using var middleware = new TenantService(logger, cache, serviceDirectory.Object, tokenProvider.Object, client);
    var tenants = await middleware.GetTenants();
    tenants.Should().Contain((t) => t.Id!.Equals(tenantId));
  }

  [Fact]
  public async Task CanGetTenant()
  {
    var logger = Mock.Of<ILogger<TenantService>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:tenant-service:v2")))
      .ReturnsAsync(new Uri("https://tenant-service/tenants/v2"));

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");

    var requestUrl = new Uri("https://tenant-service/tenants/v2/tenants/test");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When(HttpMethod.Get, requestUrl.AbsoluteUri)
      .Respond(
        "application/json",
        "{\"id\": \"urn:ads:platform:tenant-service:v2:/tenants/test\", \"name\": \"test\", \"realm\": \"test\", \"adminEmail\": \"tester@test.co\" }"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );
    using var middleware = new TenantService(logger, cache, serviceDirectory.Object, tokenProvider.Object, client);
    var tenant = await middleware.GetTenant(tenantId);
    tenant!.Id.Should().Be(tenantId);
  }

  [Fact]
  public static async Task CanGetTenantByRealm()
  {
    var logger = Mock.Of<ILogger<TenantService>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var serviceDirectory = new Mock<IServiceDirectory>();
    var tokenProvider = new Mock<ITokenProvider>();

    serviceDirectory
      .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:tenant-service:v2")))
      .ReturnsAsync(new Uri("https://tenant-service/tenants/v2"));

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");

    var requestUrl = new Uri("https://tenant-service/tenants/v2/tenants");
    using var mockHttp = new MockHttpMessageHandler();

    mockHttp
      .When(HttpMethod.Get, requestUrl.AbsoluteUri)
      .Respond(
        "application/json",
        "{\"results\":[{\"id\": \"urn:ads:platform:tenant-service:v2:/tenants/test\", \"name\": \"test\", \"realm\": \"test\", \"adminEmail\": \"tester@test.co\" }]}"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );
    using var middleware = new TenantService(logger, cache, serviceDirectory.Object, tokenProvider.Object, client);
    var tenant = await middleware.GetTenantByRealm("test");
    tenant!.Id.Should().Be(tenantId);
  }
}
