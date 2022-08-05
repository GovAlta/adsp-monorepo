
using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Controller;
public class RunScriptRequest
{
  [JsonPropertyName("inputs")]
  [Required]
  public IDictionary<string, JsonElement> Inputs { get; set; } = new Dictionary<string, JsonElement>();

  [JsonPropertyName("correlationId")]
  public string? CorrelationId { get; set; }
}
