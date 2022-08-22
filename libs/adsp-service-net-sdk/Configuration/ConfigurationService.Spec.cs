using Adsp.Sdk.Access;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using RestSharp;
using Microsoft.Extensions.Options;
using RichardSzalay.MockHttp;
using Moq;
using Xunit;

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
    //var x = new AdspOptions();
    //x.ServiceId = 42;
    //options.Setup(x => x.Value).Returns(x);
    // options.
    // options.Setup(x => x.Value).Returns(true);

    var service = new ConfigurationService(logger, cache, serviceDirectory, tokenProvider, options.Object);
    Console.WriteLine("aaqa");
    Console.WriteLine(service);
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

    object whatever;

    cache
      .Setup(mc => mc.TryGetValue(It.IsAny<object>(), out whatever))
      .Returns(null);

    tokenProvider.Setup((t) => t.GetAccessToken()).ReturnsAsync("token");

    var requestUrl = new Uri("https://tenant-service/tenants/v2/tenants");

    using var mockHttp = new MockHttpMessageHandler();
    mockHttp
      .When(HttpMethod.Get, requestUrl.AbsoluteUri)
      .Respond(
        "application/json",
        "{\"Platform:configuration-service\":{\"configurationSchema\":{\"asdf\":\"dfd343434fdf\",\"Hello\":\"WORLD QQQQQQQQQQQQ\"},\"description\":\"aaaaabbbface\"}}"
      );

    using var client = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    //var x = new AdspOptions();
    //x.ServiceId = 42;
    //options.Setup(x => x.Value).Returns(x);
    // options.
    // options.Setup(x => x.Value).Returns(true);

    var service = () => new ConfigurationService(logger, cache.Object, serviceDirectory.Object, tokenProvider.Object, options.Object, client);
    //  var middleware = () => new ConfigurationService(logger, ConfigurationService, options.Object, requestDelegate);

    // Func<Task> act = async () =>
    // {
    //   var nullHttp = (HttpContext?)null;
    //   await middleware().InvokeAsync(nullHttp);
    // };
    var serviceId = AdspId.Parse("urn:ads:test:test-service");
    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    //object y;

    //interface Pointlike<T>;



    var x = await service().GetConfiguration<object, object>(serviceId, tenantId);

    // Console.WriteLine("aaqa");
    // Console.WriteLine(middleware);
    //middleware.Should().NotBeNull();

    Console.WriteLine("52");

    Console.WriteLine(x);

    x.Should().Be("{'Platform:configuration-service':{ 'configurationSchema':{ 'asdf':'dfd343434fdf','Hello':'WORLD QQQQQQQQQQQQ'},'description':'aaaaabbbface'} })");
    service().Dispose();
  }

  [Fact]
  public void CanClearCacheWithTenant()
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
          ServiceId = null,
        }
      );
    //var x = new AdspOptions();
    //x.ServiceId = 42;
    //options.Setup(x => x.Value).Returns(x);
    // options.
    // options.Setup(x => x.Value).Returns(true);

    var service = () => new ConfigurationService(logger, cache, serviceDirectory, tokenProvider, options.Object);
    //  var middleware = () => new ConfigurationService(logger, ConfigurationService, options.Object, requestDelegate);

    // Func<Task> act = async () =>
    // {
    //   var nullHttp = (HttpContext?)null;
    //   await middleware().InvokeAsync(nullHttp);
    // };
    var serviceId = AdspId.Parse("urn:ads:test:test-service");
    service().ClearCached(serviceId);
    // Console.WriteLine("aaqa");
    // Console.WriteLine(middleware);
    //middleware.Should().NotBeNull();
    service.Should().Throw<ArgumentException>();
    service().Dispose();
  }

  [Fact]
  public async Task CanUseInvokeAsync()
  {
    var logger = Mock.Of<ILogger<ConfigurationService>>();
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


    var contextItems = new Dictionary<object, object?>
    {
      {
        AccessConstants.AdspContextKey,
        new User(false, new Tenant { Id = seviceId }, "tester", "tester", null)
      }
    };

    context.Setup((c) => c.Items).Returns(contextItems);

    // var middleware = new ConfigurationService(logger, ConfigurationService, options.Object, requestDelegate);

    // await middleware.InvokeAsync(context.Object);

    // contextItems.Should().ContainKey(ConfigurationService.ConfigurationContextKey);
    // contextItems[ConfigurationService.ConfigurationContextKey].Should().Be((seviceId, ConfigurationService));
  }

  [Fact]
  public async Task HttpContextIsEmpty()
  {
    var logger = Mock.Of<ILogger<ConfigurationService>>();
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

    // var context = new Mock<HttpContext>();

    // var middleware = () => new ConfigurationService(logger, ConfigurationService, options.Object, requestDelegate);

    // Func<Task> act = async () =>
    // {
    //   var nullHttp = (HttpContext?)null;
    //   await middleware().InvokeAsync(nullHttp);
    // };

    //await act.Should().ThrowAsync<ArgumentNullException>();

  }
}
