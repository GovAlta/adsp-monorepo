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


  public override IDictionary<string, object>? ReadValue(string @namespace, string name, int top = 10, string? after = null)
  {
    return null;
  }

  public override string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    return null;
  }

  public override FormSubmissionResult? GetFormSubmission(string formId, string submissionId)
  {
    var formSubmission = new FormSubmissionResult
    {
      Id = submissionId,
      FormId = formId,

      Data = new Dictionary<string, object?>
            {
                { "firstName", "Bob" },
                { "lastName", "Bing" },
                { "email", "Bob@bob.com" }
            },
      Files = new Dictionary<string, string?>
            {
                { "resume", "urn:ads:platform:file-service:v1:/files/resume" },
                { "cover", "urn:ads:platform:file-service:v1:/files/cover" }
            },
      FormDefinitionId = "job-application",
      Disposition = new FormDisposition
      {
        Id = "1234",
        Status = "rejected",
        Reason = "not good enough",
        Date = DateTime.Now,
        SecurityClassification = SecurityClassificationType.ProtectedA
      },
      CreatedBy = new Platform.User
      {
        Id = "Bob1234",
        Name = "Bob Bing"
      }

    };
    return formSubmission;
  }

}
