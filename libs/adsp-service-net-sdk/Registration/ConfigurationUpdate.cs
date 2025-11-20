
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Registration;

internal sealed class ConfigurationUpdate<T>
{
  [JsonPropertyName("operation")]
  public string Operation { get; } = "UPDATE";


  [JsonPropertyName("update")]
  public IDictionary<string, T> Update { get; set; } = new Dictionary<string, T>();
}
