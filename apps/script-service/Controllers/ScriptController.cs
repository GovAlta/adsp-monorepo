using System.Text.Json;
using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Model;
using Adsp.Platform.ScriptService.Services;
using Adsp.Sdk;
using Adsp.Sdk.Errors;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Adsp.Platform.ScriptService.Controller;

[ApiController]
[Route("/script/v1")]
[JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
public class ScriptController : ControllerBase
{
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
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant, Roles = ServiceRoles.ScriptRunner)]
  public async Task<IEnumerable<object>> RunScript(string? script, [FromBody] IDictionary<string, JsonElement> inputs)
  {
    if (String.IsNullOrWhiteSpace(script))
    {
      throw new RequestArgumentException("script parameter cannot be null or empty.");
    }

    var user = HttpContext.GetAdspUser();

    var definitions = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, Dictionary<string, ScriptDefinition>>();
    if (definitions?.TryGetValue(script, out ScriptDefinition? definition) != true || definition == null)
    {
      throw new NotFoundException($"Script definition with ID '{script}' not found.");
    }

    var luaInputs = inputs.ToDictionary(
      (input) => input.Key,
      (input) =>
      {
        object? converted = null;
        switch (input.Value.ValueKind)
        {
          case JsonValueKind.String:
            converted = input.Value.GetString();
            break;
          case JsonValueKind.Number:
            converted = input.Value.GetDecimal();
            break;
          case JsonValueKind.True:
          case JsonValueKind.False:
            converted = input.Value.GetBoolean();
            break;
        };

        return converted;
      }
    );

    var results = await _luaService.RunScript(definition, luaInputs);
    await _evenService.Send(
      new DomainEvent<ScriptExecuted>(
        ScriptExecuted.EventName,
        DateTime.Now,
        new ScriptExecuted { Definition = definition, ExecutedBy = user }
      ),
      user!.Tenant!.Id
    );

    return results;
  }
}
