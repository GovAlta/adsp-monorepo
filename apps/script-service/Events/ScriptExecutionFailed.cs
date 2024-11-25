using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Model;
using Adsp.Sdk;

namespace Adsp.Platform.ScriptService.Events;

/*
 * The class used to be derived from ScriptEvent, however
 * AJV no longer supports the inheritance mechanism used by the
 * schema generator.  The quick and dirty solution is to just copy
 * the properties of ScriptEvent here.
 */
public class ScriptExecutionFailed
{
  public const string EventName = "script-execution-failed";

  [JsonPropertyName("jobId")]
  [Required]
  public string? JobId { get; set; }

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
#pragma warning disable CA2227 // Collection properties should be read only
  public IDictionary<string, object?>? Inputs { get; set; }
#pragma warning restore CA2227 // Collection properties should be read only

  [JsonPropertyName("error")]
  public string? Error { get; set; }

  [JsonPropertyName("source")]
  public string? Source { get; set; }
}
