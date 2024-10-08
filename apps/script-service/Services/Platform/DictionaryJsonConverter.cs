using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform;
public class DictionaryJsonConverter : JsonConverter<Dictionary<string, object?>>
{
  private static readonly Type DictionaryType = typeof(Dictionary<string, object?>);

  public override Dictionary<string, object?>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
  {
    var result = new Dictionary<string, object?>();
    if (reader.TokenType == JsonTokenType.StartObject)
    {
      var depth = reader.CurrentDepth;
      string? propertyName = null;
      while (reader.Read() && !(reader.CurrentDepth == depth && reader.TokenType == JsonTokenType.EndObject))
      {
        if (reader.TokenType == JsonTokenType.PropertyName)
        {
          propertyName = reader.GetString();
        }
        else if (propertyName != null)
        {
          object? value = null;
          switch (reader.TokenType)
          {
            case JsonTokenType.String:
              value = reader.GetString();
              break;
            case JsonTokenType.Number:
              value = reader.GetDecimal();
              break;
            case JsonTokenType.True:
            case JsonTokenType.False:
              value = reader.GetBoolean();
              break;
            case JsonTokenType.StartObject:
              value = Read(ref reader, DictionaryType, options);
              break;
            case JsonTokenType.Null:
            default:
              break;
          }
          result[propertyName] = value;
          propertyName = null;
        }
      }
    }

    return result;
  }

  public override void Write(Utf8JsonWriter writer, Dictionary<string, object?> value, JsonSerializerOptions options)
  {
    JsonSerializer.Serialize(writer, value, DictionaryType, options);
  }
}

