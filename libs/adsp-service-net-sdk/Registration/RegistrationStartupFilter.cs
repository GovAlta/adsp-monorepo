using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Registration;

internal sealed class RegistrationStartupFilter : IStartupFilter
{
  private readonly IServiceRegistrar _registrar;
  private readonly ServiceRegistration _registration;

  public RegistrationStartupFilter(IServiceRegistrar registrar, IOptions<AdspOptions> options)
  {
    _registrar = registrar;
    _registration = options.Value;
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
