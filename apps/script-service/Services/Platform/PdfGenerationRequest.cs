using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;

internal sealed class PdfGenerationRequest
{
  [JsonPropertyName("operation")]
  public string Operation { get; } = "generate";

  [JsonPropertyName("templateId")]
  public string? TemplateId { get; set; }

  [JsonPropertyName("filename")]
  public string? FileName { get; set; }

  [JsonPropertyName("data")]
  public IDictionary<string, object> Data { get; set; } = new Dictionary<string, object>();
}
