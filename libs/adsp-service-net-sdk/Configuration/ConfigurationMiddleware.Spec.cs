using Adsp.Sdk.Access;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
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
    //var options = Mock.Of<IOptions<AdspOptions>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = AdspId.Parse("urn:ads:test:test-service"),
        }
      );
    //var x = new AdspOptions();
    //x.ServiceId = 42;
    //options.Setup(x => x.Value).Returns(x);
    // options.
    // options.Setup(x => x.Value).Returns(true);

    var middleware = new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);
    Console.WriteLine("aaqa");
    Console.WriteLine(middleware);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public void CanThrowForMissingServiceId()
  {
    var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
    var ConfigurationService = Mock.Of<IConfigurationService>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    //var options = Mock.Of<IOptions<AdspOptions>>();
    var options = new Mock<IOptions<AdspOptions>>();
    options
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          ServiceId = null,
        }
      );
    //var x = new AdspOptions();
    //x.ServiceId = 42;
    //options.Setup(x => x.Value).Returns(x);
    // options.
    // options.Setup(x => x.Value).Returns(true);

    var middleware = new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);
    // Console.WriteLine("aaqa");
    // Console.WriteLine(middleware);
    //middleware.Should().NotBeNull();
    middleware.Should().Throw<ArgumentException>();
  }

  //[Fact]
  // public async Task CanUseUserConfiguration()
  // {
  //   var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
  //   var ConfigurationService = Mock.Of<IConfigurationService>();
  //   var requestDelegate = Mock.Of<RequestDelegate>();

  //    var options = new Mock<IOptions<AdspOptions>>();
  //   options
  //     .Setup(o => o.Value)
  //     .Returns(
  //       new AdspOptions
  //       {
  //         ServiceId = AdspId.Parse("urn:ads:test:test-service"),
  //       }
  //     );

  //   var middleware = new ConfigurationMiddleware(logger, ConfigurationService, options.Object, requestDelegate);

  //   var ConfigurationId = AdspId.Parse("urn:ads:platform:Configuration-service:v2:/Configurations/test");
  //   var contextItems = new Dictionary<object, object?>
  //   {
  //     {
  //       AccessConstants.AdspContextKey,
  //       new User(false, new Configuration { Id = ConfigurationId }, "tester", "tester", null)
  //     }
  //   };
  //   var context = new Mock<HttpContext>();
  //   context.Setup((c) => c.Items).Returns(contextItems);

  //   await middleware.InvokeAsync(context.Object);
  //   contextItems.Should().ContainKey(ConfigurationMiddleware.ConfigurationContextKey);
  //   contextItems[ConfigurationMiddleware.ConfigurationContextKey].Should().Be((ConfigurationId, ConfigurationService));
  // }

  // [Fact]
  // public async Task CanUseConfigurationIdQueryParameterForCoreUser()
  // {
  //   var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
  //   var ConfigurationService = Mock.Of<IConfigurationService>();
  //   var requestDelegate = Mock.Of<RequestDelegate>();

  //   var middleware = new ConfigurationMiddleware(logger, ConfigurationService, requestDelegate);

  //   var ConfigurationId = AdspId.Parse("urn:ads:platform:Configuration-service:v2:/Configurations/test");
  //   var contextItems = new Dictionary<object, object?>
  //   {
  //     {
  //       AccessConstants.AdspContextKey,
  //       new User(true, null, "tester", "tester", null)
  //     }
  //   };
  //   var context = new Mock<HttpContext>();
  //   context.Setup((c) => c.Items).Returns(contextItems);

  //   var queryCollection = new QueryCollection(new Dictionary<string, StringValues> { { "ConfigurationId", new StringValues(ConfigurationId.ToString()) } });
  //   context.Setup((c) => c.Request.Query).Returns(queryCollection);

  //   await middleware.InvokeAsync(context.Object);
  //   contextItems.Should().ContainKey(ConfigurationMiddleware.ConfigurationContextKey);
  //   contextItems[ConfigurationMiddleware.ConfigurationContextKey].Should().Be((ConfigurationId, ConfigurationService));
  // }

  // [Fact]
  // public async Task CanIgnoreConfigurationIdQueryParameterForConfigurationUser()
  // {
  //   var logger = Mock.Of<ILogger<ConfigurationMiddleware>>();
  //   var ConfigurationService = Mock.Of<IConfigurationService>();
  //   var requestDelegate = Mock.Of<RequestDelegate>();

  //   var middleware = new ConfigurationMiddleware(logger, ConfigurationService, requestDelegate);

  //   var ConfigurationId = AdspId.Parse("urn:ads:platform:Configuration-service:v2:/Configurations/test");
  //   var requestedConfigurationId = AdspId.Parse("urn:ads:platform:Configuration-service:v2:/Configurations/test2");
  //   var contextItems = new Dictionary<object, object?>
  //   {
  //     {
  //       AccessConstants.AdspContextKey,
  //       new User(false, new Configuration { Id = ConfigurationId }, "tester", "tester", null)
  //     }
  //   };
  //   var context = new Mock<HttpContext>();
  //   context.Setup((c) => c.Items).Returns(contextItems);

  //   var queryCollection = new QueryCollection(new Dictionary<string, StringValues> { { "ConfigurationId", new StringValues(requestedConfigurationId.ToString()) } });
  //   context.Setup((c) => c.Request.Query).Returns(queryCollection);

  //   await middleware.InvokeAsync(context.Object);
  //   contextItems.Should().ContainKey(ConfigurationMiddleware.ConfigurationContextKey);
  //   contextItems[ConfigurationMiddleware.ConfigurationContextKey].Should().Be((ConfigurationId, ConfigurationService));
  // }
}
