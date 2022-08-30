using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;
using Adsp.Platform.ScriptService.Services.Util;

namespace Adsp.Platform.ScriptService.Services.Platform;
[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
internal class ConfigurationResult
{
  [JsonPropertyName("configuration")]
  [JsonConverter(typeof(DictionaryJsonConverter))]
  public IDictionary<string, object?> Configuration { get; set; } = new Dictionary<string, object?>();
}
