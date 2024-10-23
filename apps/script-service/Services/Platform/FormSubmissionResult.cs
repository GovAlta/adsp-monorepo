using System.Diagnostics.CodeAnalysis;
using System.Runtime.Serialization;
using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Services.Platform
{
  [SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
  internal sealed class FormSubmissionResult
  {
    public string? id { get; set; }

    public string? formDefinitionId { get; set; }

    public string? formId { get; set; }

    [JsonConverter(typeof(DictionaryJsonConverter))]
    public IDictionary<string, object?>? formData { get; set; }

    [JsonConverter(typeof(DictionaryJsonConverter))]
    public IDictionary<string, object?>? formFiles { get; set; }

    public User? createdBy { get; set; }

    public User? updatedBy { get; set; }

    public DateTime? created { get; set; }

    public DateTime? updated { get; set; }

    public FormDisposition? disposition { get; set; }

    public string? securityClassification { get; set; }
  }

  internal sealed class FormDisposition
  {
    public string? id { get; set; }

    public string? status { get; set; }

    public string? reason { get; set; }

    public DateTime? date { get; set; }

  }

  internal sealed class User
  {
    public string? id { get; set; }

    public string? name { get; set; }
  }
}
