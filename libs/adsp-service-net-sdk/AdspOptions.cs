using Adsp.Sdk.Utils;

namespace Adsp.Sdk;
public class AdspOptions
{
  public Uri? AccessServiceUrl { get; set; }

  public Uri? DirectoryUrl { get; set; }

  public AdspId? ServiceId { get; set; }

  public string? ClientSecret { get; set; }

  public string? Realm { get; set; } = "core";
}
