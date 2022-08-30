using System.Diagnostics.CodeAnalysis;
using System.Text;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;
using Adsp.Sdk.Errors;
using NLua;
using NLua.Exceptions;

namespace Adsp.Platform.ScriptService.Services;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
[SuppressMessage("Usage", "CA1031: Do not catch general exception types", Justification = "WIP: script error handling")]
internal class LuaScriptService : ILuaScriptService
{
  private readonly ILogger<LuaScriptService> _logger;
  private readonly IServiceDirectory _directory;

  public LuaScriptService(ILogger<LuaScriptService> logger, IServiceDirectory directory)
  {
    _logger = logger;
    _directory = directory;
  }

  public async Task<IEnumerable<object>> RunScript(ScriptDefinition definition, IDictionary<string, object?> inputs, string? token)
  {
    return await Task.Run(() =>
    {
      try
      {
        using var lua = new Lua();
        lua.State.Encoding = Encoding.UTF8;
        lua.RegisterFunctions(new ScriptFunctions(_directory, token));

        lua["script"] = definition.Script;
        lua["inputs"] = inputs;

        return lua.DoString(@"
          import = function () end

          local sandbox = require 'scripts/sandbox'
          return sandbox.run(script, { env = { inputs = inputs, adsp = adsp } })
        ");
      }
      catch (LuaScriptException e)
      {
        _logger.LogError(e, "Lua error encountered running script {Id}.", definition.Id);
        throw new ScriptRunException(e.Message, e);
      }
      catch (Exception e)
      {
        _logger.LogError(e, "Unrecognized error encountered running script {Id}.", definition.Id);
        throw new InternalErrorException("Unrecognized error encountered running script.", e);
      }
    });
  }
}
