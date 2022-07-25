using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Registration;
internal static class RegistrationExtensions
{
  internal static IServiceCollection AddRegistration(this IServiceCollection services, AdspOptions options)
  {
    services.AddSingleton<IServiceRegistrar, ServiceRegistrar>(
      (providers) => new ServiceRegistrar(
        providers.GetRequiredService<ILogger<ServiceRegistrar>>(),
        providers.GetRequiredService<IServiceDirectory>(),
        providers.GetRequiredService<ITokenProvider>(),
        options
      )
    );
    services.AddTransient<IStartupFilter>(
      (providers) => new RegistrationStartupFilter(providers.GetRequiredService<IServiceRegistrar>(), options)
    );
    return services;
  }
}
