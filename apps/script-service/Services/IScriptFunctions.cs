
using Adsp.Platform.ScriptService.Services.Platform;
using NLua;
namespace Adsp.Platform.ScriptService.Services;

interface IScriptFunctions
{
  string? GeneratePdf(string templateId, string filename, object values);

  IDictionary<string, object?>? GetConfiguration(string @namespace, string name);

  FormDataResult? GetFormData(string formId);

  FormSubmissionResult? GetFormSubmission(string formId, string submissionId);

  string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  );

  bool SendDomainEvent(string namespaceValue, string name, string? correlationId, LuaTable? context = null, LuaTable? payload = null);

  IDictionary<string, object?>? HttpGet(string url);

  IDictionary<string, object?>? DispositionFormSubmission(string formId, string submissionId, string dispositionStatus, string reason);

  IDictionary<string, object>? ReadValue(string @namespace, string name, int top = 10, string? after = null);

  IDictionary<string, object?>? WriteValue(string @namespace, string name, object? value);
}
