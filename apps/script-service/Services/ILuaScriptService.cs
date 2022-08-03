using Adsp.Platform.ScriptService.Model;

namespace Adsp.Platform.ScriptService.Services;
public interface ILuaScriptService
{
  Task<IEnumerable<object>> RunScript(ScriptDefinition definition, IDictionary<string, object?> inputs);
}
