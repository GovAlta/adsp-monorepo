using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Utils;

internal sealed class AdspIdJsonConverter : JsonConverter<AdspId>
{
  public override AdspId? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
  {
    var value = reader.GetString();
    return !String.IsNullOrEmpty(value) ? AdspId.Parse(value) : null;
  }

  public override void Write(Utf8JsonWriter writer, AdspId value, JsonSerializerOptions options)
  {
    writer.WriteStringValue(value?.ToString());
  }
}
