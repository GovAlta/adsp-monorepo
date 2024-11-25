using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Configuration;

internal sealed class ConfigurationMiddleware
{
  public const string ConfigurationContextKey = "ADSP:ConfigurationService";

  private readonly ILogger<ConfigurationMiddleware> _logger;
  private readonly IConfigurationService _configurationService;
  private readonly RequestDelegate _next;
  private readonly AdspId _serviceId;

  public ConfigurationMiddleware(
    ILogger<ConfigurationMiddleware> logger,
    IConfigurationService configurationService,
    IOptions<AdspOptions> options,
    RequestDelegate next
  )
  {
    if (options.Value.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.");
    }

    _logger = logger;
    _configurationService = configurationService;
    _next = next;
    _serviceId = options.Value.ServiceId;
  }

  public async Task InvokeAsync(HttpContext httpContext)
  {
    if (httpContext == null)
    {
      throw new ArgumentNullException(nameof(httpContext));
    }

    httpContext.Items.Add(ConfigurationContextKey, (_serviceId, _configurationService));

    _logger.LogTrace("Added configuration capabilities to the context for {ServiceId}.", _serviceId);

    await _next(httpContext);
  }
}
