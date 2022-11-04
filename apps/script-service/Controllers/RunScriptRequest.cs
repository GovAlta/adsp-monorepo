
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Sdk.Util;
using Adsp.Platform.ScriptService.Model;

namespace Adsp.Platform.ScriptService.Controller;

[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
public class RunScriptRequest
{
  [JsonPropertyName("inputs")]
  [JsonConverter(typeof(DictionaryJsonConverter))]
  [Required]
  public IDictionary<string, object?> Inputs { get; set; } = new Dictionary<string, object?>();

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("definition")]
  public ScriptDefinition? ScriptDefinition { get; set; }

}
