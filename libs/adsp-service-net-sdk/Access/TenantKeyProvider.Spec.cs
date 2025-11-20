using FluentAssertions;
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RichardSzalay.MockHttp;
using System.Text;
using RestSharp;

namespace Adsp.Sdk.Access.Tests;

public class TenantKeyProviderTests
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

  private static SecurityKey CreateFakeSecurityKey()
  {
    var fakeSecret = "asdv234234^&%&^%&^hjsdfb2%%%";
    return new SymmetricSecurityKey(Encoding.ASCII.GetBytes(fakeSecret));
  }

  private static IIssuerCache CreateFakeIssuerCache(bool isNull = false)
  {

    var issuerCache = new Mock<IIssuerCache>();
    if (isNull)
    {
      issuerCache.Setup(
        p => p.GetTenantByIssuer("fake-issuer")
      ).ReturnsAsync(() => null);
    }
    else
    {

      issuerCache.Setup(
        p => p.GetTenantByIssuer("fake-issuer")
      ).ReturnsAsync(CreateFakeTenant());
    }

    return issuerCache.Object;
  }

  private static IRestClient CreateFakeHttpClient(string realm)
  {
    var host = "https://fake-host.com";
    var metadataPath = $"auth/realms/{realm}/.well-known/openid-configuration";
    var metadataUrl = new Uri($"{host}/{metadataPath}");
    var jwksUri = new Uri($"{host}/fake-jwks-path");
#pragma warning disable CA2000 // Dispose objects before losing scope
    var mockHttp = new MockHttpMessageHandler();
#pragma warning restore CA2000 // Dispose objects before losing scope

    mockHttp
      .When(HttpMethod.Get, metadataUrl.AbsoluteUri)
      .Respond(
        "application/json",
        "{\"issuer\":\"fake-issuer\",\"jwks_uri\":\"https://fake-host.com/fake-jwks-path\"}"
      );

    mockHttp
      .When(HttpMethod.Get, jwksUri.AbsoluteUri)
      .Respond(
        "application/json",
"{\"keys\":[{\"kid\":\"tlbK5byYcGdR1eyujaHtxrY1czP_dWs63s8kEeSMdes\",\"kty\":\"RSA\",\"alg\":\"RS256\",\"use\":\"sig\",\"n\":\"hvn2Pjnj_7oT7-EbPX-7pB2wk7g8BJzEgczkTiDh9-5WOt3SH9nRI4uAwYIXkpEmh5XzjfHwP2ePd8Fx7Oo5cRGL-XASOj7ZsdKuCXuhLXe9SWRyLYV_4pW6NJPPZfbrr1S-fTOWm1oiW936wjJ0fq5KPo5s1uPB8B_URS4-MtOfcdipKaR4AEVRUfYkGEiQCDswBSjBV6RV_zJ60mRXDk8XCqdmo7oGOvUfXByppXci4DhAWlDrpKyztkjSCNIdNaJo9UVY3YvpPNVcvB5f3ps6TH-4sVNa_ZjSEWVgVueTytSHjHTVZ8vXPF122pr3b-wrZgZVmwjksvLJHMFq2Q\",\"e\":\"AQAB\",\"x5c\":[\"MIIC1zCCAb8CBgF+eM7KiTANBgkqhkiG9w0BAQsFADAvMS0wKwYDVQQDDCRiNmFmZjc2Mi0yMGY4LTRjNWQtODhkMy1jMzhhZTE2ZDE5MzcwHhcNMjIwMTIwMTg0MzQ1WhcNMzIwMTIwMTg0NTI1WjAvMS0wKwYDVQQDDCRiNmFmZjc2Mi0yMGY4LTRjNWQtODhkMy1jMzhhZTE2ZDE5MzcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCG+fY+OeP/uhPv4Rs9f7ukHbCTuDwEnMSBzOROIOH37lY63dIf2dEji4DBgheSkSaHlfON8fA/Z493wXHs6jlxEYv5cBI6Ptmx0q4Je6Etd71JZHIthX/ilbo0k89l9uuvVL59M5abWiJb3frCMnR+rko+jmzW48HwH9RFLj4y059x2KkppHgARVFR9iQYSJAIOzAFKMFXpFX/MnrSZFcOTxcKp2ajugY69R9cHKmldyLgOEBaUOukrLO2SNII0h01omj1RVjdi+k81Vy8Hl/emzpMf7ixU1r9mNIRZWBW55PK1IeMdNVny9c8XXbamvdv7CtmBlWbCOSy8skcwWrZAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAFujH1wRJDYArvMdKhU2dUYHneCkG6Z8DXdlIVz+0gNCSIdFUwMmlyEMFK4kmPC4pmvEXD13aYeSijcCKR0cgSESbsJohfcn51bEXT9jUGW3mmFXkWftzroIa9ogztDjr/CLFEmAr0RLeWV5eLbQi/Y2KdgZhzDLUY/sD9h3Kl9GbVhOzBLUWzgH+zHwNXWLhH77xbbvcH94AeN6RWMpyaTBWEAISg+UY2xA0zu6e2hpbs7MAweJDiS8ZhXmU6qLOZ7yHk9Iq1JL1knVpi1nNuHSZGXgZQYslKgghkHoMqEaMpigQKOr59opQUh8mPQeAJxtBeQMji/MWsEbi4WWIw0=\"],\"x5t\":\"67fiifDzfchm-BToFn-sc4NHAo8\",\"x5t#S256\":\"6Fvs_OYeZNw2WRo9gYwEyZMJk79S3XdrId9Zx7gtoKQ\"},{\"kid\":\"5FdwaPC0aOaPyC_DmDAt1AXhpVw68yx8ns5x9Wc-cfg\",\"kty\":\"RSA\",\"alg\":\"RS256\",\"use\":\"enc\",\"n\":\"6uXzBkFjvrL38Uy383R2yJOk1r953CMvRRKwGrL1UNsALW5Xi1WxrW1YeD9Pd_uTDNoOKLDRC4Lf3h3QUs8soJ_fJ4oBPvIcTWJs-qMpR9NkZjbUNfNuqpanG59ropyk3FV82-Xhgssv5Slu6_OKOCaPcOCWrXWRvvyu9_E7mp8uJ6wMCIdQgB-GhbloaQizWaWfC2nPSycJy21vQI0zp9yueJupgvzyi5biTgDnELYcBw0sqZxBy6KHPsqahHz-AMu6UG1MCkbjpiwNUDlyU-UqpYOLKqrKAmyrUQwEyTTWNT01DlYPeKjlpngXU4xlHHnBEgea9yE4iPPvfznQnQ\",\"e\":\"AQAB\",\"x5c\":[\"MIIC1zCCAb8CBgF+eM7MkjANBgkqhkiG9w0BAQsFADAvMS0wKwYDVQQDDCRiNmFmZjc2Mi0yMGY4LTRjNWQtODhkMy1jMzhhZTE2ZDE5MzcwHhcNMjIwMTIwMTg0MzQ1WhcNMzIwMTIwMTg0NTI1WjAvMS0wKwYDVQQDDCRiNmFmZjc2Mi0yMGY4LTRjNWQtODhkMy1jMzhhZTE2ZDE5MzcwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDq5fMGQWO+svfxTLfzdHbIk6TWv3ncIy9FErAasvVQ2wAtbleLVbGtbVh4P093+5MM2g4osNELgt/eHdBSzyygn98nigE+8hxNYmz6oylH02RmNtQ1826qlqcbn2uinKTcVXzb5eGCyy/lKW7r84o4Jo9w4JatdZG+/K738Tuany4nrAwIh1CAH4aFuWhpCLNZpZ8Lac9LJwnLbW9AjTOn3K54m6mC/PKLluJOAOcQthwHDSypnEHLooc+ypqEfP4Ay7pQbUwKRuOmLA1QOXJT5Sqlg4sqqsoCbKtRDATJNNY1PTUOVg94qOWmeBdTjGUcecESB5r3ITiI8+9/OdCdAgMBAAEwDQYJKoZIhvcNAQELBQADggEBAJo72owOmt7iF8DEJKWiuKvgpCxLMW1huo/iePvxv6Sk135Mwo6gJeFtcGAj6jI9G+eq+Olv7cUEY06RxyJwMBk/FecqN4fNwmfQnN7/tjvBaxfRTrQiCLst4ftnI0HTnQMQupDRzlLVy3HyOQ2GU04PUYPoLViagxwcfqTk23aDmXAe+ceCIXy/QQWfiMTLk7fDhoua+CWRuDxCvfVkJeDQ/5DI0GS6cpMcr+j7LvgaB0lgBUt+vVHn3Pi3mvmZhjDc2HYORJMtuX7Tz4bHJK8J3Ah933t2b4W3MUrlRu7Tx52+VG9W7n1CfjKUU37sGeeGU9XlCwDe1AtB7VUvaOI=\"],\"x5t\":\"LCyvcIAibQy2hBuaaSqe4zkfUGI\",\"x5t#S256\":\"BBtrdUWAwDF1a3nP8dhCyLyFEQb9cTY_0A1logM3-ZA\"}]}");

    mockHttp.Fallback.Throw(new InvalidOperationException("No matching mock handler"));

    var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = new Uri($"{host}"),
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    return client;
  }



  [Fact]
  public void CanCreateTenantKeyProvider()
  {

    var issuerCache = Mock.Of<IIssuerCache>();
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = Mock.Of<IMemoryCache>();
    var options = CreateFakeOptions();
    var tenantTokenProvider = new TenantKeyProvider(logger, cache, issuerCache, options);
    tenantTokenProvider.Should().NotBeNull();
    tenantTokenProvider.Dispose();
  }

  [Fact]
  public void WillThrowExceptionForInvalidOptions()
  {

    var issuerCache = Mock.Of<IIssuerCache>();
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = Mock.Of<IMemoryCache>();
    var options = Options.Create(new AdspOptions() { });
    Action newTokenProviderAction = () =>
    {
      _ = new TenantKeyProvider(logger, cache, issuerCache, options);
    };

    newTokenProviderAction.Should()
      .Throw<System.ArgumentException>()
      .Where(e => e.Message.StartsWith("Provided options must include value for AccessServiceUrl"));
  }

  [Fact]
  public async Task CanResolveSigningKeyFromCache()
  {

    var issuerCache = Mock.Of<IIssuerCache>();
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();
    var fakeIssuer = "fake-issuer";
    var fakeKid = "fake-kid";
    cache.Set((fakeIssuer, fakeKid), CreateFakeSecurityKey());
    var tenantTokenProvider = new TenantKeyProvider(logger, cache, issuerCache, options);

    var keyFromCache = await tenantTokenProvider.ResolveSigningKey("fake-issuer", "fake-kid");
    keyFromCache?.KeySize.Should().Be(224);
    tenantTokenProvider.Dispose();

  }

  [Fact]
  public async Task CanResolveSigningKeyFromRemote()
  {

    var issuerCache = CreateFakeIssuerCache();
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();
    var fakeKid = "tlbK5byYcGdR1eyujaHtxrY1czP_dWs63s8kEeSMdes";
    var realm = "fake-realm";
    var client = CreateFakeHttpClient(realm);

    var tenantTokenProvider = new TenantKeyProvider(
      logger, cache, issuerCache,
      options, client
    );

    var keyFromCache = await tenantTokenProvider.ResolveSigningKey("fake-issuer", fakeKid);

    keyFromCache?.KeySize.Should().Be(2048);
    tenantTokenProvider.Dispose();
  }

  [Fact]
  public async Task CanRetrieveSigningKey()
  {
    var issuerCache = CreateFakeIssuerCache();
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();
    var fakeKid = "tlbK5byYcGdR1eyujaHtxrY1czP_dWs63s8kEeSMdes";
    var realm = "fake-realm";
    var client = CreateFakeHttpClient(realm);
    var tenantTokenProvider = new TenantKeyProvider(
      logger, cache, issuerCache,
      options, client
    );

    var keyFromCache = await tenantTokenProvider.RetrieveSigningKey("fake-issuer", fakeKid);
    keyFromCache?.KeySize.Should().Be(2048);
    tenantTokenProvider.Dispose();

  }

  [Fact]
  public async Task CanNotRetrieveSigningKey()
  {
    var issuerCache = CreateFakeIssuerCache();
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();
    // Use wrong kid for testing
    var fakeKid = "error-fake-kid";
    var realm = "fake-realm";
    var client = CreateFakeHttpClient(realm);
    var tenantTokenProvider = new TenantKeyProvider(
      logger, cache, issuerCache,
      options, client
    );

    var keyFromCache = await tenantTokenProvider.RetrieveSigningKey("fake-issuer", fakeKid);

    Console.WriteLine(keyFromCache);
    keyFromCache.Should().BeNull();
    tenantTokenProvider.Dispose();
  }

  [Fact]
  public async Task WillReturnNullForNoExistedTenant()
  {
    var issuerCache = CreateFakeIssuerCache(true);
    var logger = Mock.Of<ILogger<TenantKeyProvider>>();
    var cache = new MemoryCache(new MemoryCacheOptions());
    var options = CreateFakeOptions();
    var fakeKid = "tlbK5byYcGdR1eyujaHtxrY1czP_dWs63s8kEeSMdes";
    var realm = "fake-realm";
    var client = CreateFakeHttpClient(realm);
    var tenantTokenProvider = new TenantKeyProvider(
      logger, cache, issuerCache,
      options, client
    );

    var keyFromCache = await tenantTokenProvider.RetrieveSigningKey("fake-issuer", fakeKid);

    keyFromCache.Should().BeNull();
    tenantTokenProvider.Dispose();
  }
}
