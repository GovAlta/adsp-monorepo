using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Adsp.Sdk.Configuration;
internal static class RegistrationExtensions
{
  internal static IServiceCollection AddConfiguration(this IServiceCollection services)
  {
    services.AddSingleton<IConfigurationService, ConfigurationService>();
    services.AddSingleton<IConfigurationUpdateClient, ConfigurationUpdateClient>();
    services.AddTransient<IStartupFilter, ConfigurationStartupFilter>();
    return services;
  }
}
