using System.Diagnostics.CodeAnalysis;
using Newtonsoft.Json;

namespace Adsp.Platform.ScriptService.Services.Platform;

[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
public sealed class FormSubmissionResult
{
  public string? Id { get; set; }
  public string? FormDefinitionId { get; set; }
  public string? FormId { get; set; }
  [SuppressMessage("Design", "CA2227:Collection properties should be read only", Justification = "Setter is needed to instantiate the object.")]
  public IDictionary<string, object?>? Data { get; set; } = new Dictionary<string, object?>();
  [SuppressMessage("Design", "CA2227:Collection properties should be read only", Justification = "Setter is needed to instantiate the object.")]
  public IDictionary<string, object?>? Files { get; set; } = new Dictionary<string, object?>();
  public User? CreatedBy { get; set; }
  public User? UpdatedBy { get; set; }
  public DateTime? Created { get; set; }
  public DateTime? Updated { get; set; }
  public FormDisposition? Disposition { get; set; }
  public FormDisposition? SubmissionStatus { get; set; }

  public IDictionary<string, object?> ToDictionary()
  {
    {
      var json = JsonConvert.SerializeObject(this);
      var dictionary = JsonConvert.DeserializeObject<Dictionary<string, object?>>(json);
      var fix = DictionaryToJson.Fix(dictionary);
      return fix;
    }
  }

  public static FormSubmissionResult FromDictionary(IDictionary<string, object?> submission)
  {
    var json = JsonConvert.SerializeObject(submission);
    return JsonConvert.DeserializeObject<FormSubmissionResult>(json);
  }
}

public sealed class FormDisposition
{
  public string? Id { get; set; }
  public string? Status { get; set; }
  public string? Reason { get; set; }
  public DateTime? Date { get; set; }
  public SecurityClassificationType? SecurityClassification { get; set; }

}

public sealed class User
{
  public string? Id { get; set; }
  public string? Name { get; set; }
}

public enum SecurityClassificationType
{
  ProtectedA,
  ProtectedB,
  ProtectedC,
  Public
}

