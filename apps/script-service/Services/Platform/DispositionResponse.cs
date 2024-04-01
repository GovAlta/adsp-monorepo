using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Services.Platform;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class DispositionResponse
{
  [JsonPropertyName("urn")]
  public string? Urn { get; set; }

  [JsonPropertyName("created")]
  public DateTime? Created { get; set; }

  [JsonPropertyName("createdBy")]
  public CreatedBy? CreatedBy { get; set; }

  [JsonPropertyName("definitionId")]
  public string? DefinitionId { get; set; }

  [JsonPropertyName("disposition")]
  public Disposition? Disposition { get; set; }

  [JsonPropertyName("formData")]
  public object? FormData { get; set; }

  [JsonPropertyName("formFiles")]
  public object? FormFiles { get; set; }

  [JsonPropertyName("formId")]
  public string? FormId { get; set; }

  [JsonPropertyName("formDefinitionId")]
  public string? FormDefinitionId { get; set; }

  [JsonPropertyName("id")]
  public string? Id { get; set; }

  [JsonPropertyName("submissionStatus")]
  public string? SubmissionStatus { get; set; }

  [JsonPropertyName("tenantId")]
  public string? TenantId { get; set; }

  [JsonPropertyName("updateDateTime")]
  public string? UpdateDateTime { get; set; }

  [JsonPropertyName("updated")]
  public DateTime? Updated { get; set; }

  [JsonPropertyName("updatedBy")]
  public UpdatedBy? UpdatedBy { get; set; }

  [JsonPropertyName("hash")]
  public string? Hash { get; set; }
}

[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class CreatedBy
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }

  [JsonPropertyName("name")]
  public string? Name { get; set; }
}

[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class UpdatedBy
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }

  [JsonPropertyName("name")]
  public string? Name { get; set; }
}

[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class Disposition
{
  [JsonPropertyName("date")]
  public string? Date { get; set; }

  [JsonPropertyName("id")]
  public string? Id { get; set; }

  [JsonPropertyName("reason")]
  public string? Reason { get; set; }

  [JsonPropertyName("status")]
  public string? Status { get; set; }
}

