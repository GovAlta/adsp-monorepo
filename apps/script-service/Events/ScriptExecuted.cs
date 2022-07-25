using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Events;
public class ScriptExecuted
{
  public const string EVENT_NAME = "script-executed";

  [JsonPropertyName("definition")]
  public ScriptDefinition Definition { get; set; }

  [JsonPropertyName("executedBy")]
  public UserIdentifier ExecutedBy { get; set; }
}
