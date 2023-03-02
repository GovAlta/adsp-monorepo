using Adsp.Platform.ScriptService.Services.Platform;
using NLua;

namespace Adsp.Platform.ScriptService.Services;

internal sealed class StubScriptFunctions : IScriptFunctions
{
  public FormDataResult? GetFormData(string formId)
  {
    return null;
  }

  public string? GeneratePdf(string templateId, string filename, object values)
  {
    return null;
  }

  public string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    return null;
  }

  public IDictionary<string, object?>? GetConfiguration(string @namespace, string name)
  {
    return null;
  }
}
