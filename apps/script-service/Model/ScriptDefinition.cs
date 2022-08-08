using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Model;
public class ScriptDefinition
{
  [JsonPropertyName("id")]
  [Required]
  public string? Id { get; set; }
  [JsonPropertyName("script")]
  [Required]
  public string? Script { get; set; }
  [JsonPropertyName("includeValuesInEvent")]
  public bool? IncludeValuesInEvent { get; set; } = false;
}
