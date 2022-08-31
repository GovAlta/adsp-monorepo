using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Amqp;
using Adsp.Sdk.Events;
using Microsoft.Extensions.Options;

namespace Adsp.Platform.ScriptService.Events;
internal class ScriptSubscriber : IEventSubscriber<IDictionary<string, object?>>
{
  private readonly AdspId _serviceId;
  private readonly IConfigurationService _configurationService;
  private readonly ITokenProvider _tokenProvider;
  private readonly ILuaScriptService _scriptService;

  public ScriptSubscriber(
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

    _serviceId = adspOptions.Value.ServiceId;
    _configurationService = configurationService;
    _tokenProvider = tokenProvider;
    _scriptService = scriptService;
  }

  public async Task OnEvent(FullDomainEvent<IDictionary<string, object?>> received)
  {
    var configuration = await _configurationService.GetConfiguration<IDictionary<string, ScriptDefinition>, ScriptConfiguration>(
      _serviceId, received.TenantId
    );

    if (
      configuration?.TryGetTriggeredScript(received.Namespace, received.Name, out (EventIdentity, ScriptDefinition) value) == true &&
      value.Item1.IsMatch(received)
    )
    {
      var token = await _tokenProvider.GetAccessToken();
      await _scriptService.RunScript(received.TenantId!, value.Item2, received.Payload ?? new Dictionary<string, object?>(), token);
    }
  }
}
