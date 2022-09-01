using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Amqp;
using Adsp.Sdk.Events;
using Microsoft.Extensions.Options;

namespace Adsp.Platform.ScriptService.Events;
internal class ScriptSubscriber : IEventSubscriber<IDictionary<string, object?>>
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

    var configuration = await _configurationService.GetConfiguration<IDictionary<string, ScriptDefinition>, ScriptConfiguration>(
      _serviceId, received.TenantId
    );

    if (
      configuration?.TryGetTriggeredScript(received.Namespace, received.Name, out (EventIdentity, ScriptDefinition) value) == true &&
      value.Item1.IsMatch(received)
    )
    {

      var definition = value.Item2;
      _logger.LogDebug(
        "Found triggered script definition {DefinitionId} for event {Namespace}:{Name}...",
        definition.Id, received.Namespace, received.Name
      );

      var inputs = received.Payload ?? new Dictionary<string, object?>();
      var token = await _tokenProvider.GetAccessToken();
      await _scriptService.RunScript(
        received.TenantId!,
        definition,
        inputs,
        token,
        received.CorrelationId,
        null,
        new EventIdentity(received.Namespace, received.Name)
      );

      _logger.LogInformation(
        "Triggered and completed execution of script definition {DefinitionId} for event {Namespace}:{Name}.",
        definition.Id, received.Namespace, received.Name
      );
    }
  }
}
