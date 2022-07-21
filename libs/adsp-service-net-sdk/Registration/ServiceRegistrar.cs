using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Registration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class ServiceRegistrar : IServiceRegistrar
{
  private readonly ILogger<ServiceRegistrar> _logger;
  public ServiceRegistrar(ILogger<ServiceRegistrar> logger)
  {
    _logger = logger;
  }

  public async Task Register(ServiceRegistration registration)
  {
  }
}
