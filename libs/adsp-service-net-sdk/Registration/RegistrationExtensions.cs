using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Adsp.Sdk.Registration;

internal static class RegistrationExtensions
{
  internal static IServiceCollection AddRegistration(this IServiceCollection services)
  {
    services.AddSingleton<IServiceRegistrar, ServiceRegistrar>();
    services.AddTransient<IStartupFilter, RegistrationStartupFilter>();
    return services;
  }
}
