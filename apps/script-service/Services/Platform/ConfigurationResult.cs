using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Services.Platform;

internal sealed class ConfigurationResult
{
  [JsonPropertyName("configuration")]
  [JsonConverter(typeof(DictionaryJsonConverter))]
  public IDictionary<string, object?> Configuration { get; set; } = new Dictionary<string, object?>();
}
