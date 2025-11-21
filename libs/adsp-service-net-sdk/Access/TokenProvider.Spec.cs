using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using RestSharp;
using RichardSzalay.MockHttp;
using Xunit;

namespace Adsp.Sdk.Access;

public class TokenProviderTests
{
  [Fact]
  public void CanCreateTokenProvider()
  {
    var logger = Mock.Of<ILogger<TokenProvider>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          AccessServiceUrl = new Uri("http://access-service"),
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
          ClientSecret = "test secret"
        }
      );
    var client = Mock.Of<IRestClient>();

    using var provider = new TokenProvider(logger, options.Object, client);
    provider.Should().NotBeNull();
  }

  [Fact]
  public void CanThrowForMissingAccessServiceUrl()
  {
    var logger = Mock.Of<ILogger<TokenProvider>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
          ClientSecret = "test secret"
        }
      );
    var client = Mock.Of<IRestClient>();

    var create = () => new TokenProvider(logger, options.Object, client);
    create.Should().Throw<ArgumentException>();
  }

  [Fact]
  public void CanThrowForMissingServiceId()
  {
    var logger = Mock.Of<ILogger<TokenProvider>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          AccessServiceUrl = new Uri("http://access-service"),
          ClientSecret = "test secret"
        }
      );
    var client = Mock.Of<IRestClient>();

    var create = () => new TokenProvider(logger, options.Object, client);
    create.Should().Throw<ArgumentException>();
  }

  [Fact]
  public void CanThrowForMissingClientSecret()
  {
    var logger = Mock.Of<ILogger<TokenProvider>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          AccessServiceUrl = new Uri("http://access-service"),
          ServiceId = AdspId.Parse("urn:ads:test:test-service")
        }
      );
    var client = Mock.Of<IRestClient>();

    var create = () => new TokenProvider(logger, options.Object, client);
    create.Should().Throw<ArgumentException>();
  }

  [Fact]
  public async Task CanGetToken()
  {
    var logger = Mock.Of<ILogger<TokenProvider>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          AccessServiceUrl = new Uri("http://access-service"),
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
          ClientSecret = "test secret"
        }
      );

    var requestUrl = new Uri("http://access-service/auth/realms/core/protocol/openid-connect/token");
    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When(HttpMethod.Post, requestUrl.AbsoluteUri)
      .Respond("application/json", "{\"access_token\": \"token\", \"expires_in\": 300}");

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    using var provider = new TokenProvider(logger, options.Object, client);
    var result = await provider.GetAccessToken();
    result.Should().Be("token");
  }

  [Fact]
  public async Task CanGetTokenFromCache()
  {
    var logger = Mock.Of<ILogger<TokenProvider>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          AccessServiceUrl = new Uri("http://access-service"),
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
          ClientSecret = "test secret"
        }
      );

    var requestUrl = new Uri("http://access-service/auth/realms/core/protocol/openid-connect/token");
    using var mockHttp = new MockHttpMessageHandler();
    var request = mockHttp
      .When(HttpMethod.Post, requestUrl.AbsoluteUri)
      .Respond("application/json", "{\"access_token\": \"token\", \"expires_in\": 300}");

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    using var provider = new TokenProvider(logger, options.Object, client);
    var result = await provider.GetAccessToken();
    result = await provider.GetAccessToken();
    result.Should().Be("token");

    mockHttp.GetMatchCount(request).Should().Be(1);
  }
}
