using Adsp.Platform.ScriptService.Services.Platform;
using Adsp.Sdk;
using NLua;
using RestSharp;

namespace Adsp.Platform.ScriptService.Services;

internal sealed class StubScriptFunctions : ScriptFunctions, IScriptFunctions
{

  public StubScriptFunctions(AdspId tenantId, IServiceDirectory directory, Func<Task<string>> getToken, IEventService eventService)
  : base(tenantId, directory, getToken, eventService)
  {
  }

  public override string? GeneratePdf(string templateId, string filename, object values)
  {
    return null;
  }

  public override string? SendDomainEvent(string namespaceValue, string name, string? correlationId, IDictionary<string, object>? context = null, IDictionary<string, object>? payload = null)
  {
    return "Simulated success";
  }

  public override string? DispositionFormSubmission(string formId, string submissionId, object dispositionState, string reason)
  {
    return "Simulated disposition success";
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
