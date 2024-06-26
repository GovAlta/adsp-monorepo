using Adsp.Platform.ScriptService.Services.Platform;
using Adsp.Sdk;
using NLua;
using RestSharp;

namespace Adsp.Platform.ScriptService.Services;

internal sealed class StubScriptFunctions : ScriptFunctions, IScriptFunctions
{

  public StubScriptFunctions(AdspId tenantId, IServiceDirectory directory, Func<Task<string>> getToken)
  : base(tenantId, directory, getToken)
  {
  }

  public override string? GeneratePdf(string templateId, string filename, object values)
  {
    return null;
  }

  public override bool SendDomainEvent(string namespaceValue, string name, string? correlationId, IDictionary<string, object>? context = null, IDictionary<string, object>? payload = null)
  {
    return true;
  }

  public override DispositionResponse? DispositionFormSubmission(string formId, string submissionId, string dispositionStatus, string reason)
  {
    return null;
  }

  public override object? HttpGet(string url)
  {
    return "simulated success";
  }

  public override string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    return null;
  }
}
