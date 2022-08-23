using System.Diagnostics.CodeAnalysis;
using System.Net;
using Adsp.Sdk.Registration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RestSharp;

namespace Adsp.Sdk.Event;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
internal class EventService : IEventService, IDisposable
{
  private static readonly AdspId EVENT_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:event-service:v1");

  private readonly ILogger<EventService> _logger;
  private readonly IServiceRegistrar _registrar;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly string _namespace;
  private readonly RestClient _client;

  public EventService(
    ILogger<EventService> logger,
    IServiceRegistrar registrar,
    IServiceDirectory serviceDirectory,
    ITokenProvider tokenProvider,
    IOptions<AdspOptions> options,
    RestClient? client = null
  )
  {
    if (options.Value.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.");
    }

    _logger = logger;
    _registrar = registrar;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _namespace = options.Value.ServiceId.Namespace;
    _client = client ?? new RestClient();
  }

  public async Task Send<TPayload>(DomainEvent<TPayload> @event, AdspId? tenantId = null) where TPayload : class
  {
    var definition = _registrar.GetEventDefinition(@event.Name);
    if (definition == null)
    {
      throw new InvalidOperationException(
        $"Specified event '{@event.Name}' is not recognized. Event definition must be registered."
      );
    }

    var eventServiceUrl = await _serviceDirectory.GetServiceUrl(EVENT_SERVICE_API_ID);
    var requestUrl = new Uri(eventServiceUrl, "v1/events");

    var token = await _tokenProvider.GetAccessToken();
    var request = new RestRequest(requestUrl, Method.Post);
    request.AddHeader("Authorization", $"Bearer {token}");
    request.AddJsonBody(new EventRequestBody<TPayload>(_namespace, @event, tenantId));

    var response = await _client.ExecuteAsync(request);
    if (response.StatusCode != HttpStatusCode.OK)
    {
      _logger.LogError(
        "Error encountered sending domain event with status '{Status}': {Content}",
        response.StatusCode,
        response.Content
      );
    }
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
