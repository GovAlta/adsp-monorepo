
using Adsp.Platform.ScriptService.Services.Platform;
using NLua;
namespace Adsp.Platform.ScriptService.Services;
interface IScriptFunctions
{

  string? GeneratePdf(string templateId, string filename, object values);
  IDictionary<string, object?>? GetConfiguration(string @namespace, string name);
  FormDataResult? GetFormData(string formId);
  string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  );
  string? SendDomainEvent(string namespaceValue, string name, string? correlationId, IDictionary<string, object>? context = null, IDictionary<string, object>? payload = null);
  object? HttpGet(string url);

  string? DispositionFormSubmission(string formId, string submissionId, object dispositionState, string reason);
}
