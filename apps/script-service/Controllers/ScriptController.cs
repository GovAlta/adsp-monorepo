using System.Text.Json.Serialization;
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

  public ScriptController(ILogger<ScriptController> logger, ILuaScriptService luaService)
  {
    _logger = logger;
    _luaService = luaService;
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

    var configuration = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>, ScriptConfiguration>();
    if (configuration?.Definitions.TryGetValue(script, out ScriptDefinition? definition) != true || definition == null)
    {
      throw new NotFoundException($"Script definition with ID '{script}' not found.");
    }

    var user = HttpContext.GetAdspUser();
    if (!definition.IsAllowedUser(user))
    {
      throw new NotAllowedRunnerException(user);
    }

    var luaInputs = request.Inputs ?? new Dictionary<string, object?>();

    string authorization = HttpContext.Request.Headers[HeaderNames.Authorization].First();
    var outputs = await _luaService.RunScript(
      user!.Tenant!.Id!, definition, luaInputs, authorization[TOKEN_INDEX..], request.CorrelationId, user
    );

    return outputs;
  }
}
