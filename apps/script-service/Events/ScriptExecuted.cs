using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Events;
public class ScriptExecuted : ScriptEvent
{
  public const string EventName = "script-executed";

  [JsonPropertyName("outputs")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public IEnumerable<object>? Outputs { get; set; }
}
