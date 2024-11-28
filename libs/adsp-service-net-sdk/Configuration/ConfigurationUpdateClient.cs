using Adsp.Sdk.Events;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk.Configuration;

internal sealed class ConfigurationUpdateClient : IEventSubscriber<ConfigurationUpdate>
{
  private const string ConfigurationEventNamespace = "configuration-service";
  private const string ConfigurationUpdatedEvent = "configuration-updated";

  private readonly ILogger<ConfigurationUpdateClient> _logger;
  private readonly IConfigurationService _configurationService;

  public ConfigurationUpdateClient(ILogger<ConfigurationUpdateClient> logger, IConfigurationService configurationService)
  {
    _logger = logger;
    _configurationService = configurationService;
  }

  public Task OnEvent(FullDomainEvent<ConfigurationUpdate> received)
  {
    if (
      String.Equals(ConfigurationEventNamespace, received.Namespace, StringComparison.Ordinal) &&
      String.Equals(ConfigurationUpdatedEvent, received.Name, StringComparison.Ordinal)
    )
    {
      _configurationService.ClearCached(
        AdspId.Parse($"urn:ads:{received.Payload!.Namespace}:{received.Payload!.Name}"),
        received.TenantId
      );
    }

    return Task.CompletedTask;
  }
}
