using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Configuration;

internal sealed class ConfigurationStartupFilter : IStartupFilter
{
  private readonly IConfigurationUpdateClient _client;
  private readonly bool _enabled;

  public ConfigurationStartupFilter(IConfigurationUpdateClient client, IOptions<AdspOptions> options)
  {
    _client = client;
    _enabled = options.Value.EnableConfigurationInvalidation ?? false;
  }

  public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
  {
    return builder =>
    {
      if (_enabled)
      {
        _client.Connect();
      }
      next(builder);
    };
  }
}
