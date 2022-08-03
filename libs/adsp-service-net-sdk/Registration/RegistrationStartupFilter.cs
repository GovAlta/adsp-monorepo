using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Registration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class RegistrationStartupFilter : IStartupFilter
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
