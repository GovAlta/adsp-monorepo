using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Events;
public class ScriptExecutionFailed : ScriptEvent
{
  public const string EventName = "script-execution-failed";

  [JsonPropertyName("error")]
  public string? Error { get; set; }
}
