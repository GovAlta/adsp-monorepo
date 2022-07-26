
using Microsoft.Extensions.Logging;
using SocketIOClient;

namespace Adsp.Sdk.Configuration;
internal class ConfigurationUpdateClient
{
  private static readonly AdspId PushServiceId = AdspId.Parse("urn:ads:platform:push-service");

  private readonly ILogger<ConfigurationUpdateClient> _logger;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly IConfigurationService _configurationService;
  private SocketIO _client;

  public ConfigurationUpdateClient(
    ILogger<ConfigurationUpdateClient> logger,
    IServiceDirectory serviceDirectory,
    ITokenProvider tokenProvider,
    IConfigurationService configurationService
  )
  {
    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _configurationService = configurationService;
  }

  public async Task Connect()
  {
    if (_client == null)
    {
      var pushServiceUrl = await _serviceDirectory.GetServiceUrl(PushServiceId);
      var token = await _tokenProvider.GetAccessToken();
      _client = new SocketIO(
        new Uri(pushServiceUrl, "platform"),
        new SocketIOOptions
        {
          Query = new Dictionary<string, string> { { "stream", "config" } },
          ExtraHeaders = new Dictionary<string, string> { { "Authorization", $"Bearer {token}" } }
        }
      );
    }

    try
    {
      await _client.ConnectAsync();
    }
    catch (Exception e)
    {
      _logger.LogError(e, "Error encountered connecting to socket.");
      throw;
    }
  }
}