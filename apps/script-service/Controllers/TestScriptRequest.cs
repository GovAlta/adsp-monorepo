
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Controller;

public class TestScriptRequest
{
  [JsonPropertyName("inputs")]
  [JsonConverter(typeof(DictionaryJsonConverter))]
  [Required]
#pragma warning disable CA2227 // Collection properties should be read only
  public IDictionary<string, object?> Inputs { get; set; } = new Dictionary<string, object?>();
#pragma warning restore CA2227 // Collection properties should be read only

  [JsonPropertyName("script")]
  public string? Script { get; set; }
}
