using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class PdfGenerationResult
{
  [JsonPropertyName("id")]
  public string? Id { get; set; }
}
