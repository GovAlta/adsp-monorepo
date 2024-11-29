using FluentAssertions;
using Microsoft.Extensions.Options;
using Xunit;
using Moq;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Access.Tests;

public class IssuerCacheTests
{
  private static IOptions<AdspOptions> CreateFakeOptions()
  {

    AdspOptions adspOptions = new AdspOptions()
    {
      AccessServiceUrl = new Uri("http://www.mock-test.com/")
    };
    IOptions<AdspOptions> options = Options.Create(adspOptions);

    return options;
  }

  private static Tenant CreateFakeTenant()
  {
    var tenant = new Tenant();
    tenant.Name = "test-tenant";
    tenant.Id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    tenant.AdminEmail = "tester@gov.ab.ca";

    // realm name shall be consisted with http response content.
    tenant.Realm = "fake-realm";
    return tenant;
  }

  private static ITenantService CreateFakeTenantService()
  {
    var tenantService = new Mock<ITenantService>();
    var tenants = new List<Tenant>
    {
      CreateFakeTenant()
    };
    tenantService.Setup(
      p => p.GetTenants()
    ).ReturnsAsync(tenants);

    return tenantService.Object;
  }

  [Fact]
  public void CanCreateIssuerCache()
  {
    var logger = Mock.Of<ILogger<IssuerCache>>();
    var cache = Mock.Of<IMemoryCache>();
    var tenantService = Mock.Of<ITenantService>();
    var options = CreateFakeOptions();
    var issuerCache = new IssuerCache(logger, cache, tenantService, options);
    issuerCache.Should().NotBeNull();
  }

  [Fact]
  public void CanThrowExceptionForWrongOptions()
  {
    var adspOptions = new AdspOptions();
    var options = Options.Create(adspOptions);
    var logger = Mock.Of<ILogger<IssuerCache>>();
    var cache = Mock.Of<IMemoryCache>();
    var tenantService = Mock.Of<ITenantService>();

    Action newIssuerCacheAction = () =>
    {
      var issuerCache = new IssuerCache(logger, cache, tenantService, options);
    };

    newIssuerCacheAction.Should()
      .Throw<System.ArgumentException>()
      .Where(e => e.Message.StartsWith("Provided options must include value for AccessServiceUrl"));
  }


  [Fact]
  public async Task CanGetTenantIssuerFromCache()
  {
    var logger = Mock.Of<ILogger<IssuerCache>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();
    var tenant = new Tenant();
    tenant.Name = "fake-tenant";
    cache.Set("fake-issuer", tenant);
    var tenantService = Mock.Of<ITenantService>();
    var issuerCache = new IssuerCache(logger, cache, tenantService, options);
    var tenantInCache = await issuerCache.GetTenantByIssuer("fake-issuer");
    tenantInCache?.Name.Should().Be(tenant.Name);
  }

  [Fact]
  public async Task CanGetTenantIssuerFromRemote()
  {
    var logger = Mock.Of<ILogger<IssuerCache>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();

    var tenantService = CreateFakeTenantService();
    var issuer = "http://www.mock-test.com/auth/realms/fake-realm";
    var issuerCache = new IssuerCache(logger, cache, tenantService, options);
    var tenant = await issuerCache.GetTenantByIssuer(issuer);
    tenant?.Name.Should().Be("test-tenant");
  }
}
