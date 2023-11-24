using Adsp.Platform.ScriptService.Services.Platform;
using Adsp.Platform.ScriptService.Events;
using Adsp.Platform.ScriptService.Services.Util;
using Adsp.Sdk;
using NLua;
using RestSharp;
using System.Net.Mime;

namespace Adsp.Platform.ScriptService.Services;
internal class ScriptFunctions : IScriptFunctions
{
  private readonly AdspId _tenantId;
  private readonly IServiceDirectory _directory;
  private readonly Func<Task<string>> _getToken;
  private readonly IEventService _eventService;
  private readonly RestClient _client;


  public ScriptFunctions(AdspId tenantId, IServiceDirectory directory, Func<Task<string>> getToken, IEventService eventService, RestClient? client = null)
  {
    _tenantId = tenantId;
    _directory = directory;
    _getToken = getToken;
    _eventService = eventService;
    _client = client ?? new RestClient(new RestClientOptions { ThrowOnAnyError = true });
  }

  public virtual string? GeneratePdf(string templateId, string filename, object values)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.PdfServiceId).Result;
    var requestUrl = new Uri(servicesUrl, "/pdf/v1/jobs");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Post);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var generationRequest = new PdfGenerationRequest
    {
      TemplateId = templateId,
      FileName = filename
    };

    if (values is LuaTable table)
    {
      generationRequest.Data = table.ToDictionary();
    }
    else if (values is IDictionary<string, object> dictionary)
    {
      generationRequest.Data = dictionary;
    }
    else
    {
      throw new ArgumentException("values is not a recognized type.");
    }

    request.AddJsonBody(generationRequest);

    var result = _client.PostAsync<PdfGenerationResult>(request).Result;
    return result?.Id;
  }

  public IDictionary<string, object?>? GetConfiguration(string @namespace, string name)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ConfigurationServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/configuration/v2/configuration/{@namespace}/{name}/active");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("orLatest", "true");
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var result = _client.GetAsync<ConfigurationResult>(request).Result;
    return result?.Configuration;
  }

  public FormDataResult? GetFormData(string formId)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/form/v1/forms/{formId}/data");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var result = _client.GetAsync<FormDataResult>(request).Result;
    return result;
  }

  public virtual string? SendDomainEvent(string namespaceValue, string name, string? correlationId, IDictionary<string, object>? context = null, IDictionary<string, object>? payload = null)
  {
    var eventServiceUrl = _directory.GetServiceUrl(AdspPlatformServices.EventServiceId).Result;
    var requestUrl = new Uri(eventServiceUrl, $"/event/v1/events");
    var token = _getToken().Result;
    var sentPayload = payload != null ? payload : new Dictionary<string, object>();
    var body = new
    {
      @namespace = namespaceValue,
      name = name,
      correlationId = correlationId,
      context = context,
      timestamp = DateTime.Now,
      payload = sentPayload
    };

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddJsonBody(body);
    request.AddHeader("Authorization", $"Bearer {token}");

    var result = new RestResponse();
    try
    {
      result = _client.PostAsync(request).Result;

      return "success";

    }
    catch (AggregateException e)
    {
      return $"Failure: {e.Message}";
    }
  }

  public virtual string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.TaskServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/task/v1/queues/{queueNamespace}/{queueName}/tasks");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    var generationRequest = new TaskCreationRequest
    {
      Name = name,
      Description = description,
      RecordId = recordId,
      Priority = priority,
      Context = context?.ToDictionary()
    };
    request.AddJsonBody(generationRequest);

    var result = _client.PostAsync<TaskCreationResult>(request).Result;
    return result?.Id;
  }
}
