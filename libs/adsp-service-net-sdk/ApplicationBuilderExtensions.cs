
using Adsp.Sdk.Configuration;
using Microsoft.AspNetCore.Builder;

namespace Adsp.Sdk;
public static class ApplicationBuilderExtensions
{
  public static IApplicationBuilder UseAdsp(this IApplicationBuilder builder)
  {
    builder.UseMiddleware<ConfigurationMiddleware>();
    return builder;
  }
}
