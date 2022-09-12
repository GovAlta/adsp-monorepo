
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Events;
[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
public abstract class ScriptEvent
{
  [JsonPropertyName("jobId")]
  [Required]
  public Guid? JobId { get; set; }

  [JsonPropertyName("definition")]
  [Required]
  public ScriptDefinition? Definition { get; set; }

  [JsonPropertyName("executedBy")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public UserIdentifier? ExecutedBy { get; set; }

  [JsonPropertyName("triggeredBy")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public EventIdentity? TriggeredBy { get; set; }

  [JsonPropertyName("inputs")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public IDictionary<string, object?>? Inputs { get; set; }
}
