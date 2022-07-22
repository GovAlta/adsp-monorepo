using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Adsp.Sdk.Registration;
internal class RegistrationStartupFilter : IStartupFilter
{
  private readonly IServiceRegistrar _registrar;
  private readonly ServiceRegistration _registration;

  public RegistrationStartupFilter(IServiceRegistrar registrar, ServiceRegistration registration)
  {
    _registrar = registrar;
    _registration = registration;
  }

  public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
  {
    return builder =>
    {
      _registrar.Register(_registration);
      next(builder);
    };
  }
}
