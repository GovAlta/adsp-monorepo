using System.Net;
using Adsp.Sdk.Access;
using Microsoft.Extensions.Logging;
using RestSharp;

namespace Adsp.Sdk.Event;
internal class EventService : IEventService
{
  private static readonly AdspId EVENT_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:event-service:v1");

  private readonly ILogger<EventService> _logger;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly string _namespace;
  private readonly RestClient _client;

  public EventService(ILogger<EventService> logger, IServiceDirectory serviceDirectory, ITokenProvider tokenProvider, AdspOptions options)
  {
    if (options?.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.");
    }

    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _namespace = options.ServiceId.Namespace;
    _client = new RestClient();
  }

  public async Task Send<TPayload>(DomainEvent<TPayload> domainEvent, AdspId? tenantId = null) where TPayload : class
  {
    var eventServiceUrl = await _serviceDirectory.GetServiceUrl(EVENT_SERVICE_API_ID);
    var requestUrl = new Uri(eventServiceUrl, "v1/events");

    var token = await _tokenProvider.GetAccessToken();
    var request = new RestRequest(requestUrl, Method.Post);
    request.AddHeader("Authorization", $"Bearer {token}");
    request.AddJsonBody(new EventRequestBody<TPayload>(_namespace, domainEvent));

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
}
