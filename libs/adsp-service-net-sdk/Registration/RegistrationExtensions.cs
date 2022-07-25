using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Adsp.Sdk.Registration;
internal static class RegistrationExtensions
{
  internal static IServiceCollection AddRegistration(this IServiceCollection services, ServiceRegistration registration)
  {
    services.AddSingleton<IServiceRegistrar, ServiceRegistrar>();
    services.AddTransient<IStartupFilter>(
      (providers) => new RegistrationStartupFilter(providers.GetRequiredService<IServiceRegistrar>(), registration)
    );
    return services;
  }
}
