using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;
[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class TaskCreationResult
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }
}
