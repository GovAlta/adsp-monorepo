
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Error;
using Microsoft.AspNetCore.Builder;

namespace Adsp.Sdk;
public static class ApplicationBuilderExtensions
{
  public static IApplicationBuilder UseAdsp(this IApplicationBuilder builder)
  {
    builder.UseMiddleware<ConfigurationMiddleware>();
    builder.UseExceptionHandler(config => config.Run(HttpResponseExceptionHandler.Handle));

    return builder;
  }
}
