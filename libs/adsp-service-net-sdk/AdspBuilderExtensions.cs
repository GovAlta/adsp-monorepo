
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Errors;
using Adsp.Sdk.Metadata;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Builder;

namespace Adsp.Sdk;
public static class AdspBuilderExtensions
{
  public static IApplicationBuilder UseAdsp(this IApplicationBuilder builder)
  {
    // This middleware is necessary for the default authentication scheme to work in authorization.
    builder.UseAuthentication();

    builder.UseMiddleware<TenantMiddleware>();
    builder.UseMiddleware<ConfigurationMiddleware>();
    builder.UseExceptionHandler(config => config.Run(HttpResponseExceptionHandler.Handle));

    return builder;
  }

  public static IApplicationBuilder UseAdspMetadata(this IApplicationBuilder builder, AdspMetadataOptions options)
  {
    builder.UseMiddleware<MetadataMiddleware>(options);

    return builder;
  }
}
