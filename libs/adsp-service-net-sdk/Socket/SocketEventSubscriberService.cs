using System.Text.Json;
using Adsp.Sdk.Events;
using Adsp.Sdk.Util;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SocketIO.Serializer.SystemTextJson;
using SocketIOClient;
using SocketIOClient.Transport;

namespace Adsp.Sdk.Socket;

internal sealed class SocketEventSubscriberService<TPayload, TSubscriber> : ISubscriberService, IDisposable
  where TPayload : class
  where TSubscriber : IEventSubscriber<TPayload>
{
  private readonly string _streamId;
  private readonly ILogger<SocketEventSubscriberService<TPayload, TSubscriber>> _logger;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly ITenantService _tenantService;
  private readonly IEventSubscriber<TPayload> _subscriber;
  private readonly string? _realm;
  private readonly bool _enabled;
  private SocketIOClient.SocketIO? _client;
  private volatile bool _intentionalDisconnect;

  private static readonly TimeSpan ReconnectDelay = TimeSpan.FromSeconds(5);

  public SocketEventSubscriberService(
    string streamId,
    ILogger<SocketEventSubscriberService<TPayload, TSubscriber>> logger,
    IServiceDirectory serviceDirectory,
    ITokenProvider tokenProvider,
    ITenantService tenantService,
    TSubscriber subscriber,
    IOptions<AdspOptions> options,
    bool enabled = true
  )
  {
    _streamId = streamId;
    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _tenantService = tenantService;
    _subscriber = subscriber;
    _realm = options.Value.Realm;
    // Note: This is used to enable / disable the connection at start up but after DI registration.
    _enabled = enabled;
  }

  public void Connect()
  {
    ConnectAsync().Wait();
  }

  private async Task ConnectAsync()
  {
    if (!_enabled)
    {
      _logger.LogInformation("Socket event subscriber for stream {StreamId} is not enabled and will not be connecting.", _streamId);
      return;
    }

    _intentionalDisconnect = false;

    if (_client == null)
    {
      _client = await CreateSocketClient();
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

  public void Disconnect()
  {
    _intentionalDisconnect = true;
    var client = _client;
    if (client != null)
    {
      if (client.Connected)
      {
        client.DisconnectAsync().Wait();
      }
    }
  }

  private async Task<SocketIOClient.SocketIO> CreateSocketClient()
  {
    var tenant = _realm != null ? await _tenantService.GetTenantByRealm(_realm) : null;

    var pushServiceUrl = await _serviceDirectory.GetServiceUrl(AdspPlatformServices.PushServiceId);
    var token = await _tokenProvider.GetAccessToken();

    var serializerOptions = new JsonSerializerOptions();
    serializerOptions.Converters.Add(new DictionaryJsonConverter());
    var client = new SocketIOClient.SocketIO(
      pushServiceUrl,
      new SocketIOOptions
      {
        Reconnection = false,
        Transport = TransportProtocol.WebSocket,
        Query = new Dictionary<string, string> { { "stream", _streamId } },
        Auth = new Dictionary<string, string> { { "token", token } }
      }
    )
    {
      Serializer = new SystemTextJsonSerializer(serializerOptions)
    };

    client.OnConnected += (_s, _e) =>
    {
      _logger.LogInformation("Connected to stream {StreamId} for events at: {Url}", _streamId, pushServiceUrl);
    };
    client.OnDisconnected += async (_s, _e) =>
    {
      _logger.LogInformation("Disconnected from stream {StreamId}.", _streamId);

      // Only reconnect if disconnect was not intentional.
      if (!_intentionalDisconnect)
      {
        _logger.LogInformation("Reconnecting to stream {StreamId} in {Seconds} seconds...", _streamId, ReconnectDelay.TotalSeconds);
        await Task.Delay(ReconnectDelay);

        // Update the token and reconnect.
        var token = await _tokenProvider.GetAccessToken();
        client.Options.Auth = new Dictionary<string, string> { { "token", token } };

        await client.ConnectAsync();
      }
    };
    client.OnError += (_s, e) =>
    {
      _logger.LogError("Error encountered in stream {StreamId}. {Msg}", _streamId, e);
    };
    client.OnAny((name, response) =>
    {
      _logger.LogDebug("Received event {Name} from stream {StreamId}.", name, _streamId);

      var received = response.GetValue<FullDomainEvent<TPayload>>();
      if (received.TenantId == null && tenant != null)
      {
        received.TenantId = tenant.Id;
      }

      _subscriber.OnEvent(received);
    });

    return client;
  }

  public void Dispose()
  {
    var client = _client;
    if (client != null)
    {
      Disconnect();
      client.Dispose();
    }
  }
}
