using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NLua;

namespace Adsp.Platform.ScriptService.Controller;

[ApiController]
[Route("/script/v2")]
[JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
public class ScriptController : ControllerBase
{
  private readonly ILogger<ScriptController> _logger;

  public ScriptController(ILogger<ScriptController> logger)
  {
    _logger = logger;
  }


  [HttpGet]
  [Route("scripts")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public async Task<IEnumerable<ScriptDefinition>> GetScripts()
  {
    var (definitions, _) = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>>();

    return definitions?.Values ?? Enumerable.Empty<ScriptDefinition>();
  }

  [HttpGet]
  [Route("scripts/{script?}")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant)]
  public async Task<ScriptDefinition> GetScript(string? script)
  {
    if (String.IsNullOrEmpty(script))
    {
      throw new ArgumentNullException(nameof(script));
    }

    var (definitions, _) = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>>();
    if (definitions?.TryGetValue(script, out ScriptDefinition? definition) != true)
    {
      throw new ArgumentException($"Script definition with ID '{script}' not found.", nameof(script));
    }

    return definition;
  }

  [HttpPost]
  [Route("scripts/{script?}")]
  [Authorize(AuthenticationSchemes = AdspAuthenticationSchemes.Tenant, Roles = ServiceRoles.ScriptRunner)]
  public async Task<IEnumerable<object>> RunScript(string? script, [FromBody] IDictionary<string, JsonElement> inputs)
  {
    if (String.IsNullOrEmpty(script))
    {
      throw new ArgumentNullException(nameof(script));
    }

    var (definitions, _) = await HttpContext.GetConfiguration<Dictionary<string, ScriptDefinition>>();
    // if (definitions?.TryGetValue(script, out ScriptDefinition? definition) != true)
    // {
    //   throw new ArgumentException($"Script definition with ID '{script}' not found.", nameof(script));
    // }

    IEnumerable<object> results;
    using (var lua = new Lua())
    {
      lua.State.Encoding = Encoding.UTF8;
      lua["inputs"] = inputs.ToDictionary((input) => input.Key, (input) =>
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
        }

        return converted;
      });
      lua.LoadCLRPackage();

      lua.DoString(@"
        import ('System.Collections.Generic')
        import = function () end
      ");

      results = lua.DoString(@"
        return inputs['test'], inputs['value']
      ");
    }

    return results;
  }
}
