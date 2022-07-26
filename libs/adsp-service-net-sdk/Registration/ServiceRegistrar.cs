using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Logging;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Registration;
internal class ServiceRegistrar : IServiceRegistrar
{
  private static readonly AdspId CONFIGURATION_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:configuration-service:v2");
  private static readonly AdspId CONFIGURATION_SERVICE_ID = AdspId.Parse("urn:ads:platform:configuration-service");
  private static readonly AdspId TENANT_SERVICE_ID = AdspId.Parse("urn:ads:platform:tenant-service");
  private static readonly AdspId EVENT_SERVICE_ID = AdspId.Parse("urn:ads:platform:event-service");

  private readonly ILogger<ServiceRegistrar> _logger;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly RestClient _client;
  private readonly AsyncPolicy _retryPolicy;
  private readonly AdspId _serviceId;
  private readonly Dictionary<string, DomainEventDefinition> _eventDefinitions = new();

  public ServiceRegistrar(ILogger<ServiceRegistrar> logger, IServiceDirectory serviceDirectory, ITokenProvider tokenProvider, AdspOptions options)
  {
    if (options?.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.");
    }

    _logger = logger;
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _serviceId = options.ServiceId;

    _client = new RestClient();
    _retryPolicy = Policy.Handle<Exception>().WaitAndRetryAsync(
      10,
      retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
      (exception, timeSpan, retryCount, context) =>
      {
        _logger.LogDebug("Try {Count}: update registration configuration...", retryCount);
      }
    );
  }

  public async Task Register(ServiceRegistration registration)
  {
    if (registration.Configuration != null)
    {
      await UpdateConfiguration(
        CONFIGURATION_SERVICE_ID,
        new
        {
          operation = "UPDATE",
          update = new Dictionary<string, object>() {
            { $"{_serviceId.Namespace}:{_serviceId.Service}", registration.Configuration }
          }
        }
      );
    }

    if (registration.Roles != null)
    {
      await UpdateConfiguration(
        TENANT_SERVICE_ID,
        new
        {
          operation = "UPDATE",
          update = new Dictionary<string, object>
          {
            { _serviceId.ToString(), new { roles = registration.Roles } }
          }
        }
      );
    }

    if (registration.Events != null)
    {
      await UpdateConfiguration(
        EVENT_SERVICE_ID,
        new
        {
          operation = "UPDATE",
          update = new Dictionary<string, object>
          {
            {
              _serviceId.Service,
              new
              {
                name = _serviceId.Namespace,
                definitions = registration.Events.ToDictionary(definition => definition.Name)
              }
            }
          }
        }
      );

      foreach (var eventDefinition in registration.Events)
      {
        _eventDefinitions.Add(eventDefinition.Name, eventDefinition);
      }
    }

    _logger.LogInformation("Completed registration for {Service}.", _serviceId.Service);
  }

  public DomainEventDefinition? GetEventDefinition(string name)
  {
    _eventDefinitions.TryGetValue(name, out DomainEventDefinition? result);
    return result;
  }

  private async Task UpdateConfiguration<T>(AdspId serviceId, T update) where T : class
  {
    _logger.LogDebug("Updating registration configuration for {Service}...", serviceId.Service);

    var configurationServiceUrl = await _serviceDirectory.GetServiceUrl(CONFIGURATION_SERVICE_API_ID);
    var requestUrl = new Uri(configurationServiceUrl, $"v2/configuration/{serviceId.Namespace}/{serviceId.Service}");

    await _retryPolicy.ExecuteAsync(async () =>
    {
      var token = await _tokenProvider.GetAccessToken();

      var request = new RestRequest(requestUrl, Method.Patch);
      request.AddHeader("Authorization", $"Bearer {token}");
      request.AddJsonBody(update);

      await _client.PatchAsync(request);
    });
  }
}
