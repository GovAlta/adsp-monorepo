using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adsp.Platform.ScriptService.Services.Platform
{
  public class DictionaryJsonConverter : JsonConverter<SerializableDictionary<string, object?>>
  {
    public override SerializableDictionary<string, object?> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
      var dictionary = JsonSerializer.Deserialize<Dictionary<string, object?>>(ref reader, options);
      var serializableDict = new SerializableDictionary<string, object?>();

      // Convert the standard dictionary to the SerializableDictionary
      if (dictionary != null)
      {
        foreach (var kvp in dictionary)
        {
          serializableDict.Add(kvp.Key, kvp.Value);
        }
      }

      return serializableDict;
    }

    public override void Write(Utf8JsonWriter writer, SerializableDictionary<string, object?> value, JsonSerializerOptions options)
    {
      if (value != null)
      {
        var dictionary = value.ToDictionary();
        JsonSerializer.Serialize(writer, dictionary, options);
      }
    }
  }
}
