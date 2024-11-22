using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;

internal sealed class TaskCreationRequest
{
  [JsonPropertyName("name")]
  public string? Name { get; set; }

  [JsonPropertyName("description")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public string? Description { get; set; }

  [JsonPropertyName("recordId")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public string? RecordId { get; set; }

  [JsonPropertyName("priority")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public string? Priority { get; set; }

  [JsonPropertyName("context")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public IDictionary<string, object>? Context { get; set; }
}
