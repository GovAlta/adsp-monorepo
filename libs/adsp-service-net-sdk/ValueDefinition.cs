using System.Text.Json;
using System.Text.Json.Serialization;
using Adsp.Sdk.Utils;
using NJsonSchema;
using NJsonSchema.Generation;

namespace Adsp.Sdk;

public abstract class ValueDefinition
{
  protected static readonly SystemTextJsonSchemaGeneratorSettings SchemaSettings = new()
  {
    SerializerOptions = new JsonSerializerOptions { }
  };

  [JsonPropertyName("name")]
  public string Id { get; private set; }

  [JsonPropertyName("displayName")]
  public string Name { get; private set; }

  [JsonPropertyName("description")]
  public string Description { get; private set; }

  [JsonPropertyName("jsonSchema")]
  [JsonConverter(typeof(JsonSchemaConverter))]
  public JsonSchema JsonSchema { get; private set; }

  protected ValueDefinition(string id, string name, string description, JsonSchema configurationSchema)
  {
    Id = id;
    Name = name;
    Description = description;
    JsonSchema = configurationSchema;
  }
}

public class ValueDefinition<TValue> : ValueDefinition where TValue : class
{
  public ValueDefinition(string id, string name, string description) :
    base(id, name, description, JsonSchema.FromType<TValue>(SchemaSettings))
  {
  }
}
