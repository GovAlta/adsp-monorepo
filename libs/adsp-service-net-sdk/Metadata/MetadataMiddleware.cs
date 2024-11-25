using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Metadata;

internal sealed class MetadataMiddleware
{
  public const string ConfigurationServiceContextKey = "ADSP:ConfigurationService";

  private readonly ILogger<MetadataMiddleware> _logger;
  private readonly AdspOptions _adspOptions;
  private readonly AdspMetadataOptions _options;
  private readonly RequestDelegate _next;

  public MetadataMiddleware(ILogger<MetadataMiddleware> logger, IOptions<AdspOptions> adspOptions, AdspMetadataOptions options, RequestDelegate next)
  {

    _logger = logger;
    _adspOptions = adspOptions.Value;
    _options = options;
    _next = next;
  }

  public async Task InvokeAsync(HttpContext httpContext)
  {
    if (httpContext == null)
    {
      throw new ArgumentNullException(nameof(httpContext));
    }

    var httpMethod = httpContext.Request.Method;
    var path = httpContext.Request.Path.Value;
    var url = new Uri(httpContext.Request.GetEncodedUrl());

    if (httpMethod == "GET" && (String.Equals("/", path, StringComparison.Ordinal) || String.IsNullOrEmpty(path)))
    {
      var links = new Dictionary<string, Link> {
        { "self", new Link { Href = url } }
      };

      if (!String.IsNullOrEmpty(_options.SwaggerJsonPath))
      {
        links.Add("docs", new Link { Href = new Uri(url, _options.SwaggerJsonPath) });
      }

      if (!String.IsNullOrEmpty(_options.HealthCheckPath))
      {
        links.Add("health", new Link { Href = new Uri(url, _options.HealthCheckPath) });
      }

      if (!String.IsNullOrEmpty(_options.ApiPath))
      {
        links.Add("api", new Link { Href = new Uri(url, _options.ApiPath) });
      }

      httpContext.Response.StatusCode = 200;
      await httpContext.Response.WriteAsJsonAsync(new ServiceMetadata
      {
        Name = _adspOptions.DisplayName,
        Description = _adspOptions.Description,
        Links = links
      });

      return;
    }

    await _next(httpContext);
  }
}
