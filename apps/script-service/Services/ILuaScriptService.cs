using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Services;
public interface ILuaScriptService
{
  Task<IEnumerable<object>> RunScript(
    AdspId tenantId,
    ScriptDefinition definition,
    IDictionary<string, object?> inputs,
    string token,
    string? correlationId = null,
    UserIdentifier? user = null
  );
}
