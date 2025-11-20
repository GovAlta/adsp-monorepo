using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Adsp.Sdk;

public class EventIdentity(string @namespace, string name)
{
  [JsonPropertyName("namespace")]
  [Required]
  public string Namespace { get; private set; } = @namespace;

  [JsonPropertyName("name")]
  [Required]
  public string Name { get; private set; } = name;

  [JsonPropertyName("criteria")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public EventIdentityCriteria? Criteria { get; set; }
}

public class EventIdentityCriteria
{
  [JsonPropertyName("correlationId")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
#pragma warning disable CA2227 // Collection properties should be read only
  public IDictionary<string, object>? Context { get; set; }
#pragma warning restore CA2227 // Collection properties should be read only
}
