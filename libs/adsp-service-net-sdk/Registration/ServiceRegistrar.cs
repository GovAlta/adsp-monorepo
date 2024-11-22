using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using RestSharp;

namespace Adsp.Sdk.Registration;

internal sealed class ServiceRegistrar : IServiceRegistrar, IDisposable
{
  private static readonly AdspId CONFIGURATION_SERVICE_API_ID = AdspId.Parse("urn:ads:platform:configuration-service:v2");


  private const string ContextServiceKey = "service";

  private readonly ILogger<ServiceRegistrar> _logger;
  private readonly IServiceDirectory _serviceDirectory;
  private readonly ITokenProvider _tokenProvider;
  private readonly IRestClient _client;
  private readonly AsyncPolicy _retryPolicy;
  private readonly AdspId _serviceId;
  private readonly Dictionary<string, DomainEventDefinition> _eventDefinitions = [];

  public ServiceRegistrar(
    ILogger<ServiceRegistrar> logger,
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
    _serviceDirectory = serviceDirectory;
    _tokenProvider = tokenProvider;
    _serviceId = options.Value.ServiceId;
    _client = client ?? new RestClient();
    _retryPolicy = Policy.Handle<Exception>().WaitAndRetryAsync(
      10,
      retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
      (exception, timeSpan, retryCount, context) =>
      {
        _logger.LogDebug("Try {Count}: update registration configuration of {Service}..", retryCount, context.GetValueOrDefault(ContextServiceKey));
      }
    );
  }

  public async Task Register(ServiceRegistration registration)
  {
    if (registration.Configuration != null)
    {
      await UpdateConfiguration(
        AdspPlatformServices.ConfigurationServiceId,
        new ConfigurationUpdate<ConfigurationDefinition>
        {
          Update = new Dictionary<string, ConfigurationDefinition>() {
            { $"{_serviceId.Namespace}:{_serviceId.Service}", registration.Configuration }
          }
        }
      );
    }

    if (registration.Roles != null)
    {
      await UpdateConfiguration(
        AdspPlatformServices.TenantServiceId,
        new ConfigurationUpdate<object>
        {
          Update = new Dictionary<string, object>
          {
            { _serviceId.ToString(), new { roles = registration.Roles } }
          }
        }
      );
    }

    if (registration.Events != null)
    {
      await UpdateConfiguration(
        AdspPlatformServices.EventServiceId,
        new ConfigurationUpdate<object>
        {
          Update = new Dictionary<string, object>
          {
            {
              _serviceId.Service!,
              new
              {
                name = _serviceId.Service,
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

    if (registration.EventStreams != null)
    {
      await UpdateConfiguration(
        AdspPlatformServices.PushServiceId,
        new ConfigurationUpdate<StreamDefinition>
        {
          Update = registration.EventStreams.ToDictionary(definition => definition.Id)
        }
      );
    }

    if (registration.FileTypes != null)
    {
      await UpdateConfiguration(
        AdspPlatformServices.FileServiceId,
        new ConfigurationUpdate<FileType>
        {
          Update = registration.FileTypes.ToDictionary(type => type.Id)
        }
      );
    }

    if (registration.Values != null)
    {
      await UpdateConfiguration(
        AdspPlatformServices.ValueServiceId,
        new ConfigurationUpdate<object>
        {
          Update = new Dictionary<string, object> {
            {
              _serviceId.Service!,
              new
              {
                name = _serviceId.Service,
                Definitions = registration.Values.ToDictionary(definition => definition.Id)
              }
            }
          }
        }
      );
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
    await _retryPolicy.ExecuteAsync(
      async (_ctx) =>
      {
        var token = await _tokenProvider.GetAccessToken();

        var request = new RestRequest(requestUrl, Method.Patch);
        request.AddHeader("Authorization", $"Bearer {token}");
        request.AddJsonBody(update);

        var response = await _client.ExecuteAsync(request);
      },
      new Dictionary<string, object?> { { ContextServiceKey, serviceId.Service } }
    );

    _logger.LogInformation("Updating registration configuration for {Service}.", serviceId.Service);
  }

  public void Dispose()
  {
    _client.Dispose();
  }
}
