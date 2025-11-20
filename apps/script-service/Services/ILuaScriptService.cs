using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Services;

public interface ILuaScriptService
{
  Task<IEnumerable<object>> RunScript(
    string jobId,
    AdspId tenantId,
    ScriptDefinition definition,
    IDictionary<string, object?> inputs,
    Func<Task<string>> getToken,
    string? correlationId = null,
    UserIdentifier? user = null,
    EventIdentity? trigger = null
  );

  IEnumerable<object> TestScript(
    IDictionary<string, object?> inputs,
    Func<Task<string>> getToken,
    string script,
    AdspId tenantId
  );
}
