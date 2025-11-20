using System.Text.Json;
using System.Text.Json.Serialization;
using Adsp.Sdk.Utils;
using NJsonSchema;
using NJsonSchema.Generation;

namespace Adsp.Sdk;

public abstract class DomainEventDefinition
{
  protected static readonly SystemTextJsonSchemaGeneratorSettings SchemaSettings = new()
  {
    SerializerOptions = new JsonSerializerOptions { }
  };

  [JsonPropertyName("name")]
  public string Name { get; private set; }

  [JsonPropertyName("description")]
  public string Description { get; private set; }

  [JsonPropertyName("payloadSchema")]
  [JsonConverter(typeof(JsonSchemaConverter))]
  public JsonSchema PayloadSchema { get; private set; }

  [JsonIgnore]
  public Type PayloadType { get; private set; }

  protected DomainEventDefinition(string name, string description, Type payloadType)
  {
    Name = name;
    Description = description;
    PayloadType = payloadType;
    PayloadSchema = JsonSchema.FromType(payloadType, SchemaSettings);
  }
}

public class DomainEventDefinition<TPayload> : DomainEventDefinition where TPayload : class
{
  public DomainEventDefinition(string name, string description) : base(name, description, typeof(TPayload))
  {
  }
}
