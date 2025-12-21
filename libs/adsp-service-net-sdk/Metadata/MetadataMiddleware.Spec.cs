using System.Text;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Adsp.Sdk.Metadata;

public class MetadataMiddlewareTests
{

  private static DefaultHttpContext GetMockHttpContext(String method, String path, String host)
  {
    var context = new DefaultHttpContext();
    context.Request.Method = method;
    context.Request.Scheme = "https";
    context.Request.Path = path;
    context.Request.Host = new HostString(host);
    return context;
  }
  [Fact]
  public void CanCreateMetadataMiddleware()
  {
    var logger = Mock.Of<ILogger<MetadataMiddleware>>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var adspOptions = new Mock<IOptions<AdspOptions>>();
    var options = new AdspMetadataOptions
    {
      SwaggerJsonPath = "docs/v1/swagger.json",
      HealthCheckPath = "/health",
      ApiPath = "/test"
    };
    adspOptions
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          DisplayName = "test",
          Description = "test description"
        }
      );


    var middleware = new MetadataMiddleware(logger, adspOptions.Object, options, requestDelegate);
    middleware.Should().NotBeNull();
  }

  [Fact]
  public async Task CanAddMetadata()
  {
    var logger = Mock.Of<ILogger<MetadataMiddleware>>();
    var requestDelegate = Mock.Of<RequestDelegate>();
    var adspOptions = new Mock<IOptions<AdspOptions>>();
    var options = new AdspMetadataOptions
    {
      SwaggerJsonPath = "docs/v1/swagger.json",
      HealthCheckPath = "/health",
      ApiPath = "/test"
    };
    adspOptions
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          DisplayName = "test",
          Description = "test description"
        }
      );
    var context = GetMockHttpContext("GET", "/", "localhost");
    var bodyStream = new MemoryStream();
    context.Response.Body = bodyStream;

    var middleware = new MetadataMiddleware(logger, adspOptions.Object,
    options, requestDelegate);

    await middleware.InvokeAsync(context);

    Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);

    var data = Encoding.UTF8.GetString(bodyStream.ToArray());
    Assert.Equal("{\"name\":\"test\",\"description\":\"test description\",\"_links\":{\"self\":{\"href\":\"https://localhost/\"},\"docs\":{\"href\":\"https://localhost/docs/v1/swagger.json\"},\"health\":{\"href\":\"https://localhost/health\"},\"api\":{\"href\":\"https://localhost/test\"}}}", data);
  }

  [Fact]
  public async Task CanSkipAddingMetadataForNotGETCalls()
  {

    var logger = Mock.Of<ILogger<MetadataMiddleware>>();
    var requestDelegate = new Mock<RequestDelegate>();
    var adspOptions = new Mock<IOptions<AdspOptions>>();
    var options = new AdspMetadataOptions
    {
      SwaggerJsonPath = "docs/v1/swagger.json",
      HealthCheckPath = "/health",
      ApiPath = "/test"
    };
    adspOptions
      .Setup(o => o.Value)
      .Returns(
        new AdspOptions
        {
          DisplayName = "test",
          Description = "test description"
        }
      );
    var context = GetMockHttpContext("POST", "/", "localhost");

    var middleware = new MetadataMiddleware(logger, adspOptions.Object,
    options, requestDelegate.Object);

    await middleware.InvokeAsync(context);
    requestDelegate.Verify(r => r(context), Times.Once);
  }
}
