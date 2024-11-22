using System.Text.Json.Serialization;
using Adsp.Sdk.Util;

namespace Adsp.Platform.ScriptService.Services.Platform;

internal sealed class FormDataResult
{
  [JsonConverter(typeof(DictionaryJsonConverter))]
  public IDictionary<string, object?>? data { get; set; }

  public IDictionary<string, string?>? files { get; set; }
}
