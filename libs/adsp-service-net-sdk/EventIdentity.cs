using System.ComponentModel.DataAnnotations;
using System.Diagnostics.CodeAnalysis;
using System.Text.Json.Serialization;

namespace Adsp.Sdk;
public class EventIdentity
{
  [JsonPropertyName("namespace")]
  [Required]
  public string Namespace { get; private set; }

  [JsonPropertyName("name")]
  [Required]
  public string Name { get; private set; }

  [JsonPropertyName("criteria")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public EventIdentityCriteria? Criteria { get; set; }

  public EventIdentity(string @namespace, string name)
  {
    Namespace = @namespace;
    Name = name;
  }
}

[SuppressMessage("Usage", "CA2227: Collection properties should be read only", Justification = "Data transfer object")]
public class EventIdentityCriteria
{
  [JsonPropertyName("correlationId")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public string? CorrelationId { get; set; }

  [JsonPropertyName("context")]
  [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
  public IDictionary<string, object>? Context { get; set; }
}
