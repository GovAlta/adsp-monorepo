
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Errors;
using Adsp.Sdk.Metadata;
using Adsp.Sdk.Metrics;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Builder;

namespace Adsp.Sdk;

public static class AdspBuilderExtensions
{
  /// <summary>
  /// Adds ADSP middleware and handlers to the application's request pipeline.
  /// This method also calls UseAuthentication() for default authentication scheme support in AuthorizeAttribute.
  /// </summary>
  /// <param name="builder">Application builder instance to apply ADSP components.</param>
  /// <returns>Application builder instance for fluent configuration.</returns>
  public static IApplicationBuilder UseAdsp(this IApplicationBuilder builder)
  {
    // This middleware is necessary for the default authentication scheme to work in authorization.
    builder.UseAuthentication();

    builder.UseMiddleware<TenantMiddleware>();
    builder.UseMiddleware<ConfigurationMiddleware>();
    builder.UseExceptionHandler(config => config.Run(HttpResponseExceptionHandler.Handle));

    return builder;
  }

  /// <summary>
  /// Adds ADSP metadata middleware for service metadata discovery via the directory services.
  /// </summary>
  /// <param name="builder">Application builder instance to apply ADSP metadata middleware.</param>
  /// <param name="options">Metadata options include paths to health and documentation endpoints.</param>
  /// <returns>Application builder instance for fluent configuration.</returns>
  public static IApplicationBuilder UseAdspMetadata(this IApplicationBuilder builder, AdspMetadataOptions options)
  {
    builder.UseMiddleware<MetadataMiddleware>(options);

    return builder;
  }

  /// <summary>
  /// Adds ADSP metrics middleware for capturing service metrics in value service.
  /// </summary>
  /// <remarks>
  /// This should be used first to get complete timing on the middleware chain.
  /// </remarks>
  /// <param name="builder">Application builder instance to apply ADSP metrics middleware.</param>
  /// <returns>Application builder instance for fluent configuration.</returns>
  public static IApplicationBuilder UseAdspMetrics(this IApplicationBuilder builder)
  {
    builder.UseMiddleware<MetricsMiddleware>();

    return builder;
  }
}
