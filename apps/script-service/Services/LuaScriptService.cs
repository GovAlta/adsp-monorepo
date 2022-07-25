using System.Diagnostics.CodeAnalysis;
using System.Text;
using Adsp.Platform.ScriptService.Model;
using NLua;
using NLua.Exceptions;

namespace Adsp.Platform.ScriptService.Services;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class LuaScriptService : ILuaScriptService
{
  private readonly ILogger<LuaScriptService> _logger;
  public LuaScriptService(ILogger<LuaScriptService> logger)
  {
    _logger = logger;
  }

  public async Task<IEnumerable<object>> RunScript(ScriptDefinition definition, IDictionary<string, object?> inputs)
  {
    try
    {
      using var lua = new Lua();
      lua.State.Encoding = Encoding.UTF8;
      lua.LoadCLRPackage();
      lua["script"] = definition.Script;
      lua["inputs"] = inputs;

      return lua.DoString(@"
        import ('System.Collections.Generic')
        import = function () end

        local sandbox = require 'scripts/sandbox'
        return sandbox.run(script, { env = { inputs = inputs } })
      ");
    }
    catch (LuaScriptException e)
    {
      _logger.LogError(e, "Error encountered running script {Id}.", definition.Id);
      throw;
    }
  }
}
