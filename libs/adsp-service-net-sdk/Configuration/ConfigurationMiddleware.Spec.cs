using Adsp.Sdk.Access;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Adsp.Sdk.Configuration;

public class ConfigurationMiddlewareTests
{
  [Fact]
  public void CanCreateConfigurationMiddleware()
  {
    var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
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

    var middleware = new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public void CanThrowForMissingServiceId()
  {
    var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
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

    var middleware = () => new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);
    middleware.Should().Throw<ArgumentException>();
  }

  [Fact]
  public async Task CanUseInvokeAsync()
  {
    var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();

    var seviceId = AdspId.Parse("urn:ads:test:test-service");

    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = seviceId,
        }
      );

    var context = new Mock<HttpContext>();

    var principal = Mock.Of<System.Security.Principal.IPrincipal>();
    var contextItems = new Dictionary<object, object?>
    {
      {
        AccessConstants.AdspContextKey,
        new User(false, new Tenant { Id = seviceId }, "tester", "tester", null, principal)
      }
    };

    context.Setup((c) => c.Items).Returns(contextItems);

    var middleware = new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);

    await middleware.InvokeAsync(context.Object);

    contextItems.Should().ContainKey(ConfigurationMiddleware.ConfigurationContextKey);
    contextItems[ConfigurationMiddleware.ConfigurationContextKey].Should().Be((seviceId, ConfigurationService));
  }

  [Fact]
  public async Task HttpContextIsEmpty()
  {
    var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();

    var seviceId = AdspId.Parse("urn:ads:test:test-service");

    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = seviceId,
        }
      );

    var context = new Mock<HttpContext>();

    var middleware = () => new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);

    Func<Task> act = async () =>
    {
#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type.
      await middleware().InvokeAsync(null);
#pragma warning restore CS8625 // Cannot convert null literal to non-nullable reference type.
    };

    await act.Should().ThrowAsync<ArgumentNullException>();

  }
}
