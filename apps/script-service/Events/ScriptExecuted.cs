using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Events;
public class ScriptExecuted
{
  public const string EventName = "script-executed";

  [JsonPropertyName("definition")]
  [Required]
  public ScriptDefinition? Definition { get; set; }

  [JsonPropertyName("executedBy")]
  [Required]
  public UserIdentifier? ExecutedBy { get; set; }

  [JsonPropertyName("inputs")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public IDictionary<string, object?>? Inputs { get; set; }

  [JsonPropertyName("outputs")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public IEnumerable<object>? Outputs { get; set; }
}
