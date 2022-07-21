using System.Text.Json.Serialization;
using Adsp.Sdk.Utils;

namespace Adsp.Sdk;
public class Tenant
{
  [JsonConverter(typeof(AdspIdJsonConverter))]
  public AdspId? Id { get; set; }
  public string? Name { get; set; }
  public string? Realm { get; set; }
  public string? AdminEmail { get; set; }
}
