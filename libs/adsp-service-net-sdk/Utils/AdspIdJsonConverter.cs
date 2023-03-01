using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Adsp.Sdk.Utils;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
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
