using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;

internal sealed class TaskCreationResult
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }
}
