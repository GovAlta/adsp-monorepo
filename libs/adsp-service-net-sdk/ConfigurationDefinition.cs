using System.Text.Json;
using System.Text.Json.Serialization;
using Adsp.Sdk.Utils;
using NJsonSchema;
using NJsonSchema.Generation;

namespace Adsp.Sdk;

public abstract class ConfigurationDefinition
{
  protected static readonly SystemTextJsonSchemaGeneratorSettings SchemaSettings = new()
  {
    SerializerOptions = new JsonSerializerOptions { }
  };

  [JsonPropertyName("description")]
  public string Description { get; private set; }

  [JsonPropertyName("configurationSchema")]
  [JsonConverter(typeof(JsonSchemaConverter))]
  public JsonSchema ConfigurationSchema { get; private set; }

  [JsonIgnore]
  public Func<object?, object?, object?>? CombineConfiguration { get; set; }

  protected ConfigurationDefinition(string description, JsonSchema configurationSchema, Func<object?, object?, object?>? combineConfiguration = null)
  {
    Description = description;
    ConfigurationSchema = configurationSchema;
    CombineConfiguration = combineConfiguration;
  }
}

public class ConfigurationDefinition<TConfiguration> : ConfigurationDefinition where TConfiguration : class
{
  public ConfigurationDefinition(string description, Func<object?, object?, object?>? combineConfiguration = null) :
    base(description, JsonSchema.FromType<TConfiguration>(SchemaSettings), combineConfiguration)
  {
  }
}
