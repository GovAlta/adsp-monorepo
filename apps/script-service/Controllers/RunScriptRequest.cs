
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Controller;
[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
public class RunScriptRequest
{
  [JsonPropertyName("inputs")]
  [Required]
  public IDictionary<string, JsonElement> Inputs { get; set; } = new Dictionary<string, JsonElement>();

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }
}
