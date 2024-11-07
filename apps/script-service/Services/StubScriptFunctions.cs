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
    if (String.IsNullOrEmpty(templateId))
    {
      throw new ArgumentException("templateId cannot be null or empty.");
    }

    return null;
  }

  public override bool SendDomainEvent(string @namespace, string name, string? correlationId, LuaTable? context = null, LuaTable? payload = null)
  {
    if (String.IsNullOrEmpty(@namespace))
    {
      throw new ArgumentException("namespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    return true;
  }

  public override DispositionResponse? DispositionFormSubmission(string formId, string submissionId, string dispositionStatus, string reason)
  {
    if (String.IsNullOrEmpty(formId))
    {
      throw new ArgumentException("formId cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(submissionId))
    {
      throw new ArgumentException("submissionId cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(dispositionStatus))
    {
      throw new ArgumentException("dispositionStatus cannot be null or empty.");
    }

    return null;
  }

  public override object? HttpGet(string url)
  {
    if (String.IsNullOrEmpty(url))
    {
      throw new ArgumentException("url cannot be null or empty.");
    }

    return "simulated success";
  }

  public override IDictionary<string, object?>? WriteValue(string @namespace, string name, object? value)
  {
    if (String.IsNullOrEmpty(@namespace))
    {
      throw new ArgumentException("namespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    return null;
  }

  public override string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    if (String.IsNullOrEmpty(queueNamespace))
    {
      throw new ArgumentException("queueNamespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(queueName))
    {
      throw new ArgumentException("queueName cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    return null;
  }

  public override FormSubmissionResult? GetFormSubmission(string formId, string submissionId)
  {
    if (String.IsNullOrEmpty(formId))
    {
      throw new ArgumentException("formId cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(submissionId))
    {
      throw new ArgumentException("submissionId cannot be null or empty.");
    }

    var formSubmission = new FormSubmissionResult
    {
      id = submissionId,
      formId = formId,
      securityClassification = "protected a",
      formData = new Dictionary<string, object?>
            {
                { "firstName", "Bob" },
                { "lastName", "Bing" },
                { "email", "Bob@bob.com" }
            },
      formFiles = new Dictionary<string, object?>
            {
                { "resume", "urn:ads:platform:file-service:v1:/files/resume" },
                { "cover", "urn:ads:platform:file-service:v1:/files/cover" }
            },
      formDefinitionId = "job-application",
      disposition = new FormDisposition
      {
        id = "1234",
        status = "rejected",
        reason = "not good enough",
        date = DateTime.Now
      },
      createdBy = new Platform.User
      {
        id = "Bob1234",
        name = "Bob Bing"
      }

    };
    return formSubmission;
  }

}
