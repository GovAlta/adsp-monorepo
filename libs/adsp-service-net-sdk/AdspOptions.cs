using Adsp.Sdk.Registration;

namespace Adsp.Sdk;
public class AdspOptions : ServiceRegistration
{
  public Uri? AccessServiceUrl { get; set; }

  public Uri? DirectoryUrl { get; set; }

  public string? ClientSecret { get; set; }

  public string? Realm { get; set; } = "core";

  public Func<object?, object?, object?>? CombineConfiguration { get; set; }
}
