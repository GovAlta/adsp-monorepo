using System.Text.Json;
using System.Text.Json.Serialization;
using NJsonSchema;

namespace Adsp.Sdk.Utils;

internal sealed class JsonSchemaConverter : JsonConverter<JsonSchema>
{
  public override JsonSchema? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
  {
    throw new NotImplementedException();
  }

  public override void Write(Utf8JsonWriter writer, JsonSchema value, JsonSerializerOptions options)
  {
    var json = value.ToJson();
    writer.WriteRawValue(json);
  }
}
