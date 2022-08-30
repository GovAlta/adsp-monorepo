using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;

namespace Adsp.Platform.ScriptService.Controller;

[ApiController]
[Route("/script/v1")]
[JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
public class ScriptController : ControllerBase
{
  private const int TOKEN_INDEX = 7;

  private readonly ILogger<ScriptController> _logger;
  private readonly ILuaScriptService _luaService;
  private readonly IEventService _evenService;

  public ScriptController(ILogger<ScriptController> logger, ILuaScriptService luaService, IEventService eventService)
  {
    _logger = logger;
    _luaService = luaService;
    _evenService = eventService;
  }

  [HttpGet]
  [Route("scripts")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public async Task<IEnumerable<ScriptDefinition>> GetScripts()
  {
    var definitions = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, Dictionary<string, ScriptDefinition>>();

    return definitions?.Values ?? Enumerable.Empty<ScriptDefinition>();
  }

  [HttpGet]
  [Route("scripts/{script?}")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public async Task<ScriptDefinition> GetScript(string? script)
  {
    if (String.IsNullOrWhiteSpace(script))
    {
      throw new RequestArgumentException("script parameter cannot be null or empty.");
    }

    var definitions = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, Dictionary<string, ScriptDefinition>>();
    if (definitions?.TryGetValue(script, out ScriptDefinition? definition) != true)
    {
      throw new NotFoundException($"Script definition with ID '{script}' not found.");
    }

    return definition!;
  }

  [HttpPost]
  [Route("scripts/{script?}")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public async Task<IEnumerable<object>> RunScript(string? script, [FromBody] RunScriptRequest request)
  {
    if (String.IsNullOrWhiteSpace(script))
    {
      throw new RequestArgumentException("script parameter cannot be null or empty.");
    }

    if (request == null)
    {
      throw new RequestArgumentException("request body cannot be null");
    }

    var definitions = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, Dictionary<string, ScriptDefinition>>();
    if (definitions?.TryGetValue(script, out ScriptDefinition? definition) != true || definition == null)
    {
      throw new NotFoundException($"Script definition with ID '{script}' not found.");
    }

    var user = HttpContext.GetAdspUser();
    if (!definition.IsAllowedUser(user))
    {
      throw new NotAllowedRunnerException(user);
    }

    var luaInputs = request.Inputs ?? new Dictionary<string, object?>();

    var authorization = HttpContext.Request.Headers[HeaderNames.Authorization].First();
    var outputs = await _luaService.RunScript(definition, luaInputs, authorization?[TOKEN_INDEX..]);

    var eventPayload = new ScriptExecuted { Definition = definition, ExecutedBy = user };
    if (definition.IncludeValuesInEvent == true)
    {
      eventPayload.Inputs = luaInputs;
      eventPayload.Outputs = outputs;
    }

    await _evenService.Send(
      new DomainEvent<ScriptExecuted>(
        ScriptExecuted.EventName,
        DateTime.Now,
        eventPayload,
        request.CorrelationId
      ),
      user!.Tenant!.Id
    );

    return outputs;
  }
}
