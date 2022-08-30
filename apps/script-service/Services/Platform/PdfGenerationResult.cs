using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;
internal class PdfGenerationResult
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }
}
