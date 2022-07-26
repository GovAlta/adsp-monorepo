using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Configuration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Middleware for application builder")]
internal class ConfigurationMiddleware
{
  public const string ConfigurationServiceContextKey = "ADSP:ConfigurationService";

  private readonly ILogger<ConfigurationMiddleware> _logger;
  private readonly IConfigurationService _configurationService;
  private readonly RequestDelegate _next;
  private readonly AdspId _serviceId;

  public ConfigurationMiddleware(ILogger<ConfigurationMiddleware> logger, IConfigurationService configurationService, AdspOptions options, RequestDelegate next)
  {
    if (options?.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.");
    }

    _logger = logger;
    _configurationService = configurationService;
    _next = next;
    _serviceId = options.ServiceId;
  }

  public async Task InvokeAsync(HttpContext httpContext)
  {
    if (httpContext == null)
    {
      throw new ArgumentNullException(nameof(httpContext));
    }

    httpContext.Items.Add(ConfigurationServiceContextKey, (_serviceId, _configurationService));

    await _next(httpContext);
  }
}
