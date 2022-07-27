
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Errors;
using Adsp.Sdk.Metadata;
using Microsoft.AspNetCore.Builder;

namespace Adsp.Sdk;
public static class AdspBuilderExtensions
{
  public static IApplicationBuilder UseAdsp(this IApplicationBuilder builder)
  {
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
