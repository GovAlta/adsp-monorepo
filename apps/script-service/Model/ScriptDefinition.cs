using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Model;
public class ScriptDefinition
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }
  [JsonPropertyName("script")]
  public string? Script { get; set; }
}
