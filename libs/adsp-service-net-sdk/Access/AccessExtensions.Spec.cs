using FluentAssertions;
using Xunit;
using Microsoft.AspNetCore.Authentication;
using Moq;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Adsp.Sdk.Access.Tests;

public class AccessExtensionsTests
{

  private static IServiceDirectory CreateFakeServiceDirectory()
  {
    var serviceDirectory = new Mock<IServiceDirectory>();
    serviceDirectory
    .Setup((d) => d.GetServiceUrl(AdspId.Parse("urn:ads:platform:tenant-service:v2")))
    .ReturnsAsync(new Uri("https://tenant-service/tenants/v2"));

    return serviceDirectory.Object;
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

  private static AdspOptions CreateFakeOptions()
  {

    AdspOptions adspOptions = new AdspOptions()
    {
      AccessServiceUrl = new Uri("http://www.mock-test.com/"),
      ServiceId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
      Realm = "fake-realm"
    };

    return adspOptions;
  }

  private static ITokenProvider CreateFakeTokenProvider()
  {
    var tokenProvider = new Mock<ITokenProvider>();
    tokenProvider.Setup((t) => t.GetAccessToken());
    return tokenProvider.Object;
  }

  private static ITenantService CreateFakeTenantService()
  {
    var tenantService = new Mock<ITenantService>();

    tenantService.Setup((t) => t.GetTenantByRealm("fake-realm"))
      .ReturnsAsync(CreateFakeTenant());

    return tenantService.Object;

  }

  private static SecurityKey CreateFakeSecurityKey()
  {
    var fakeSecret = "asdv234234^&%&^%&^hjsdfb2%%%";
    return new SymmetricSecurityKey(Encoding.ASCII.GetBytes(fakeSecret));
  }

  private static ITenantKeyProvider CreateFakeKeyProvider()
  {
    var keyProvider = new Mock<ITenantKeyProvider>();
    var fakeKid = "tlbK5byYcGdR1eyujaHtxrY1czP_dWs63s8kEeSMdes";
    var issuer = "fake-issuer";

    keyProvider.Setup(
        p => p.ResolveSigningKey(issuer, fakeKid)
      ).Returns(
        Task.FromResult(CreateFakeSecurityKey() ?? null)
      );

    return keyProvider.Object;

  }

  private static TokenValidatedContext CreateFakeTokenValidatedContext()
  {
    var httpContext = new DefaultHttpContext()
    {
      User = CreateFakeUser()
    };

    var fakeJwtBearerOption = new Mock<JwtBearerOptions>();
    var tokenHandler = new JwtSecurityTokenHandler();

    var AuthenticationScheme = new AuthenticationScheme(
      "fake-scheme",
      null,
      typeof(JwtBearerHandler)
    );

    var context = new Mock<TokenValidatedContext>(
      httpContext,
      AuthenticationScheme,
      fakeJwtBearerOption.Object)
    {

    };

    return context.Object;
  }

  private static AuthenticationBuilder CreateFakeAuthenticationBuilder()
  {
    var mockServices = new Mock<IServiceCollection>();
    return new AuthenticationBuilder(mockServices.Object);
  }


  private static IIssuerCache CreateFakeIssuerCache()
  {

    var issuerCache = new Mock<IIssuerCache>();

    issuerCache.Setup(
      p => p.GetTenantByIssuer("fake-issuer")
    ).ReturnsAsync(() => null);

    return issuerCache.Object;
  }

  private static ClaimsPrincipal CreateFakeUser()
  {

    var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
    {
        new Claim(ClaimTypes.NameIdentifier, "1"),
        new Claim(ClaimTypes.Name, "fake-user"),
    }, "mock"));

    return user;
  }


  [Fact]
  public void CanAddRealmJwtAuthentication()
  {

    var tenantScheme = AdspAuthenticationSchemes.Tenant;
    var fakeAuthBuilder = CreateFakeAuthenticationBuilder();
    var adspOptions = CreateFakeOptions();
    var tenantService = CreateFakeTenantService();

    var builder = AccessExtensions.AddRealmJwtAuthentication(
        fakeAuthBuilder,
        tenantScheme,
        tenantService,
        adspOptions
    );

    builder.Should().NotBeNull();
  }

  [Fact]
  public void CanAddTenantJwtAuthentication()
  {
    var fakeAuthBuilder = CreateFakeAuthenticationBuilder();
    var tenantScheme = AdspAuthenticationSchemes.Tenant;
    var tenantService = CreateFakeTenantService();
    var tenantKeyProvider = CreateFakeKeyProvider();
    var issuerCache = CreateFakeIssuerCache();
    var adspOptions = CreateFakeOptions();

    var builder = AccessExtensions.AddTenantJwtAuthentication(
        fakeAuthBuilder,
        tenantScheme,
        issuerCache,
        tenantKeyProvider,
        adspOptions
    );
    builder.Should().NotBeNull();
  }

  [Fact]
  public void WillThrowExceptionForInvalidOptionsInAddTenantJwtAuthentication()
  {

    var fakeAuthBuilder = CreateFakeAuthenticationBuilder();
    var tenantScheme = AdspAuthenticationSchemes.Tenant;
    var tenantService = CreateFakeTenantService();
    var tenantKeyProvider = CreateFakeKeyProvider();
    var issuerCache = CreateFakeIssuerCache();

    Action NoServiceIdInOptionAction = () =>
    {

      AdspOptions adspOptions = new AdspOptions()
      {
        AccessServiceUrl = new Uri("http://www.mock-test.com/"),
        Realm = "fake-realm"
      };

      AccessExtensions.AddTenantJwtAuthentication(
          fakeAuthBuilder,
          tenantScheme,
          issuerCache,
          tenantKeyProvider,
          adspOptions
      );
    };

    NoServiceIdInOptionAction.Should()
  .Throw<System.ArgumentException>()
  .Where(e => e.Message.StartsWith("Provided options must include value for ServiceId."));
  }



  [Fact]
  public void WillThrowExceptionForInvalidOptionsInAddRealmJwtAuthentication()
  {
    var tenantScheme = AdspAuthenticationSchemes.Tenant;
    var fakeAuthBuilder = CreateFakeAuthenticationBuilder();
    var tenantService = CreateFakeTenantService();

    Action NoAccessServiceUrlInOptionAction = () =>
    {

      AdspOptions adspOptions = new AdspOptions()
      {
        ServiceId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test"),
        Realm = "fake-realm"
      };

      AccessExtensions.AddRealmJwtAuthentication(
        fakeAuthBuilder,
        tenantScheme,
        tenantService,
        adspOptions
      );
    };

    NoAccessServiceUrlInOptionAction.Should()
      .Throw<System.ArgumentException>()
      .Where(e => e.Message.StartsWith("Provided options must include value for AccessServiceUrl"));


    Action NoServerIdInOptionAction = () =>
    {

      AdspOptions adspOptions = new AdspOptions()
      {
        AccessServiceUrl = new Uri("http://www.mock-test.com/"),
        Realm = "fake-realm"
      };

      AccessExtensions.AddRealmJwtAuthentication(
        fakeAuthBuilder,
        tenantScheme,
        tenantService,
        adspOptions
      );
    };

    NoServerIdInOptionAction.Should()
      .Throw<System.ArgumentException>()
      .Where(e => e.Message.StartsWith("Provided options must include value for ServiceId."));


    Action NoRealmInOptionAction = () =>
    {

      AdspOptions adspOptions = new AdspOptions()
      {
        AccessServiceUrl = new Uri("http://www.mock-test.com/"),
        ServiceId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test"),

      };

      AccessExtensions.AddRealmJwtAuthentication(
      fakeAuthBuilder,
      tenantScheme,
      tenantService,
      adspOptions);
    };

    NoRealmInOptionAction.Should()
      .Throw<System.ArgumentException>()
      .Where(e => e.Message.StartsWith("Provided options must include tenant realm for tenant authentication scheme."));
  }

  [Fact]
  public void CanValidateTokenContextWithNoPrinciple()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var context = AccessExtensions.AddAdspContext(tokenContext, id, true, tenant);
    context?.Principal.Should().BeNull();
  }

  [Fact]
  public void CanValidateTokenContextWithSubClaim()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    tokenContext.Principal = CreateFakeUser();
    var context = AccessExtensions.AddAdspContext(tokenContext, id, true, tenant);
    context.HttpContext.Items[AccessConstants.AdspContextKey].Should().NotBeNull();
  }

  [Fact]
  public void CanValidateTokenContextWithNotCore()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    tokenContext.Principal = CreateFakeUser();
    var context = AccessExtensions.AddAdspContext(tokenContext, id, false, tenant);
    context.HttpContext.Items[AccessConstants.AdspContextKey].Should().NotBeNull();
  }

  [Fact]
  public void CanValidateTokenContextWithoutTenant()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    tokenContext.Principal = CreateFakeUser();
    var context = AccessExtensions.AddAdspContext(tokenContext, id, false, null);
    context.HttpContext.Items[AccessConstants.AdspContextKey].Should().NotBeNull();
  }

  [Fact]
  public void CanValidateTokenContextWithRealmAccess()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
    {
        new Claim(ClaimTypes.NameIdentifier, "1"),
        new Claim(ClaimTypes.Name, "fake-user"),
        new Claim("realm_access", "{\"Roles\":[\"fake-roles\"]}")
    }, "mock"));

    tokenContext.Principal = user;
    var context = AccessExtensions.AddAdspContext(tokenContext, id, false, null);
    context.HttpContext.Items[AccessConstants.AdspContextKey].Should().NotBeNull();
  }

  [Fact]
  public void CanValidateTokenContextWithResourceAccess()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var user = new ClaimsPrincipal(new ClaimsIdentity(new Claim[]
    {
        new Claim(ClaimTypes.NameIdentifier, "1"),
        new Claim(ClaimTypes.Name, "fake-user"),
        new Claim("realm_access", "{\"Roles\":[\"fake-roles\"]}"),
        new Claim("resource_access", "{\"fake-resource\":{\"Roles\":[\"fake-resource-roles\"]}}")
    }, "mock"));

    tokenContext.Principal = user;
    var context = AccessExtensions.AddAdspContext(tokenContext, id, false, null);
    context.HttpContext.Items[AccessConstants.AdspContextKey].Should().NotBeNull();
  }


  [Fact]
  public void CanValidateTokenContextForCoreRealm()
  {
    var tokenContext = CreateFakeTokenValidatedContext();
    var tenant = CreateFakeTenant();
    tenant.Id = null;
    var id = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    tokenContext.Principal = CreateFakeUser();
    var context = AccessExtensions.AddAdspContext(tokenContext, id, true, null);
    context.HttpContext.Items[AccessConstants.AdspContextKey].Should().NotBeNull();
  }
}
