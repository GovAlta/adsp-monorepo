using System.Security.Principal;
using Adsp.Sdk.Access;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Moq;
using Xunit;

namespace Adsp.Sdk.Tenancy;

public class TenantMiddlewareTests
{
  [Fact]
  public void CanCreateTenantMiddleware()
  {
    var logger = Mock.Of<ILogger<TenantMiddleware>>();
    var tenantService = Mock.Of<ITenantService>();
    var requestDelegate = Mock.Of<RequestDelegate>();

    var middleware = new TenantMiddleware(logger, tenantService, requestDelegate);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public async Task CanUseUserTenant()
  {
    var logger = Mock.Of<ILogger<TenantMiddleware>>();
    var tenantService = Mock.Of<ITenantService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var principal = Mock.Of<IPrincipal>();

    var middleware = new TenantMiddleware(logger, tenantService, requestDelegate);

    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var contextItems = new Dictionary<object, object?>
    {
      {
        AccessConstants.AdspContextKey,
        new User(false, new Tenant { Id = tenantId }, "tester", "tester", null, principal)
      }
    };
    var context = new Mock<HttpContext>();
    context.Setup((c) => c.Items).Returns(contextItems);

    await middleware.InvokeAsync(context.Object);
    contextItems.Should().ContainKey(TenantMiddleware.TenantContextKey);
    contextItems[TenantMiddleware.TenantContextKey].Should().Be((tenantId, tenantService));
  }

  [Fact]
  public async Task CanUseTenantIdQueryParameterForCoreUser()
  {
    var logger = Mock.Of<ILogger<TenantMiddleware>>();
    var tenantService = Mock.Of<ITenantService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var principal = Mock.Of<IPrincipal>();

    var middleware = new TenantMiddleware(logger, tenantService, requestDelegate);

    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var contextItems = new Dictionary<object, object?>
    {
      {
        AccessConstants.AdspContextKey,
        new User(true, null, "tester", "tester", null, principal)
      }
    };
    var context = new Mock<HttpContext>();
    context.Setup((c) => c.Items).Returns(contextItems);

    var queryCollection = new QueryCollection(new Dictionary<string, StringValues> { { "tenantId", new StringValues(tenantId.ToString()) } });
    context.Setup((c) => c.Request.Query).Returns(queryCollection);

    await middleware.InvokeAsync(context.Object);
    contextItems.Should().ContainKey(TenantMiddleware.TenantContextKey);
    contextItems[TenantMiddleware.TenantContextKey].Should().Be((tenantId, tenantService));
  }

  [Fact]
  public async Task CanIgnoreTenantIdQueryParameterForTenantUser()
  {
    var logger = Mock.Of<ILogger<TenantMiddleware>>();
    var tenantService = Mock.Of<ITenantService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var principal = Mock.Of<IPrincipal>();

    var middleware = new TenantMiddleware(logger, tenantService, requestDelegate);

    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var requestedTenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test2");
    var contextItems = new Dictionary<object, object?>
    {
      {
        AccessConstants.AdspContextKey,
        new User(false, new Tenant { Id = tenantId }, "tester", "tester", null, principal)
      }
    };
    var context = new Mock<HttpContext>();
    context.Setup((c) => c.Items).Returns(contextItems);

    var queryCollection = new QueryCollection(new Dictionary<string, StringValues> { { "tenantId", new StringValues(requestedTenantId.ToString()) } });
    context.Setup((c) => c.Request.Query).Returns(queryCollection);

    await middleware.InvokeAsync(context.Object);
    contextItems.Should().ContainKey(TenantMiddleware.TenantContextKey);
    contextItems[TenantMiddleware.TenantContextKey].Should().Be((tenantId, tenantService));
  }
}
