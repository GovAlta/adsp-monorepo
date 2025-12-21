using Adsp.Sdk.Socket;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Configuration;

internal static class RegistrationExtensions
{
  private const string ConfigurationUpdatesStreamId = "configuration-updates";

  internal static IServiceCollection AddConfiguration(this IServiceCollection services)
  {
    services.AddSingleton<IConfigurationService, ConfigurationService>();
    services.AddSocketSubscriber<ConfigurationUpdate, ConfigurationUpdateClient>(
      ConfigurationUpdatesStreamId,
      (provider) =>
      {
        var options = provider.GetRequiredService<IOptions<AdspOptions>>();
        return options.Value?.EnableConfigurationInvalidation == true;
      }
    );
    return services;
  }
}
