using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Events;
using Microsoft.Extensions.Options;

namespace Adsp.Platform.ScriptService.Events;

internal sealed class ScriptSubscriber : IEventSubscriber<IDictionary<string, object?>>
{
  private readonly ILogger<ScriptSubscriber> _logger;
  private readonly AdspId _serviceId;
  private readonly IConfigurationService _configurationService;
  private readonly ITokenProvider _tokenProvider;
  private readonly ILuaScriptService _scriptService;

  public ScriptSubscriber(
    ILogger<ScriptSubscriber> logger,
    IConfigurationService configurationService,
    ITokenProvider tokenProvider,
    ILuaScriptService scriptService,
    IOptions<AdspOptions> adspOptions
  )
  {
    if (adspOptions.Value.ServiceId == null)
    {
      throw new ArgumentException("Provide options must include value for ServiceId.");
    }

    _logger = logger;
    _serviceId = adspOptions.Value.ServiceId;
    _configurationService = configurationService;
    _tokenProvider = tokenProvider;
    _scriptService = scriptService;
  }

  public async Task OnEvent(FullDomainEvent<IDictionary<string, object?>> received)
  {
    _logger.LogDebug("Processing event {Namespace}:{Name}...", received.Namespace, received.Name);

    if (String.Equals(_serviceId.Service, received.Namespace, StringComparison.Ordinal))
    {
      _logger.LogDebug(
        "Skipping processing of event {Namespace}:{Name} from the {Service} namespace to prevent circular execution.",
        received.Namespace, received.Name, _serviceId.Service
      );
      return;
    }

    var configuration = await _configurationService.GetConfiguration<IDictionary<string, ScriptDefinition>, ScriptConfiguration>(
      _serviceId, received.TenantId
    );

    var definitions = configuration?.GetTriggeredScripts(received) ?? Enumerable.Empty<ScriptDefinition>();
    foreach (var definition in definitions)
    {
      try
      {
        _logger.LogDebug(
          "Found triggered script definition {DefinitionId} for event {Namespace}:{Name}...",
          definition.Id, received.Namespace, received.Name
        );
        var inputs = received.Payload ?? new Dictionary<string, object?>();
        var getToken = () => _tokenProvider.GetAccessToken();
        await _scriptService.RunScript(
          Guid.NewGuid().ToString(),
          received.TenantId!,
          definition,
          inputs,
          getToken,
          received.CorrelationId,
          null,
          new EventIdentity(received.Namespace, received.Name)
        );

        _logger.LogInformation(
          "Triggered and completed execution of script definition {DefinitionId} for event {Namespace}:{Name}.",
          definition.Id, received.Namespace, received.Name
        );
      }
      catch (ScriptRunException)
      {
        _logger.LogWarning(
          "Execution of script definition {DefinitionId} for event {Namespace}:{Name} failed due to script error and will not be retried.",
          definition.Id, received.Namespace, received.Name
        );
      }
    }
  }
}
