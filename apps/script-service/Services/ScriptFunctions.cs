using Adsp.Platform.ScriptService.Services.Platform;
using Adsp.Platform.ScriptService.Services.Util;
using Adsp.Sdk;
using Adsp.Sdk.Events;
using Newtonsoft.Json.Linq;
using NLua;
using RestSharp;

namespace Adsp.Platform.ScriptService.Services;

internal class ScriptFunctions : IScriptFunctions
{
  private readonly AdspId _tenantId;
  private readonly IServiceDirectory _directory;
  private readonly Func<Task<string>> _getToken;
  private readonly IRestClient _client;


  public ScriptFunctions(AdspId tenantId, IServiceDirectory directory, Func<Task<string>> getToken, IRestClient? client = null)
  {
    _tenantId = tenantId;
    _directory = directory;
    _getToken = getToken;
    _client = client ?? new RestClient(new RestClientOptions { ThrowOnAnyError = true });
  }

  public virtual string? GeneratePdf(string templateId, string filename, object values)
  {
    if (String.IsNullOrEmpty(templateId))
    {
      throw new ArgumentException("templateId cannot be null or empty.");
    }

    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.PdfServiceId).Result;
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

    PdfGenerationResult? result = _client.PostAsync<PdfGenerationResult>(request).Result;
    return result?.Id;
  }

  public IDictionary<string, object?>? GetConfiguration(string @namespace, string name)
  {
    if (String.IsNullOrEmpty(@namespace))
    {
      throw new ArgumentException("namespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ConfigurationServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/configuration/v2/configuration/{@namespace}/{name}/active");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("orLatest", "true");
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    RestResponse data = _client.GetAsync(request).Result;
    return ParseResponse(data)?.ToDictionary<object?>();
  }

  public FormDataResult? GetFormData(string formId)
  {
    if (String.IsNullOrEmpty(formId))
    {
      throw new ArgumentException("formId cannot be null or empty.");
    }

    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/form/v1/forms/{formId}/data");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    RestResponse data = _client.GetAsync(request).Result;
    JToken? json = ParseResponse(data);
    return json != null
      ? new FormDataResult()
      {
        data = json["data"]?.ToDictionary<object?>(),
        files = json["files"]?.ToDictionary<string?>()
      }
      : null;
  }

  public virtual FormSubmissionResult? GetFormSubmission(string formId, string submissionId)
  {
    if (String.IsNullOrEmpty(formId))
    {
      throw new ArgumentException("formId cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(submissionId))
    {
      throw new ArgumentException("submissionId cannot be null or empty.");
    }

    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/form/v1/forms/{formId}/submissions/{submissionId}");

    var token = _getToken().Result;
    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    FormSubmissionResult? result = _client.GetAsync<FormSubmissionResult>(request).Result;
    return result;
  }

  public virtual bool SendDomainEvent(string @namespace, string name, string? correlationId, LuaTable? context = null, LuaTable? payload = null)
  {
    if (String.IsNullOrEmpty(@namespace))
    {
      throw new ArgumentException("namespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    Uri eventServiceUrl = _directory.GetServiceUrl(AdspPlatformServices.EventServiceId).Result;
    var requestUrl = new Uri(eventServiceUrl, $"/event/v1/events");
    var token = _getToken().Result;
    var body = new FullDomainEvent<IDictionary<string, object>>()
    {
      TenantId = _tenantId,
      Namespace = @namespace,
      Name = name,
      CorrelationId = correlationId,
      Context = context.ToDictionary(),
      Timestamp = DateTime.Now,
      Payload = payload != null ? payload.ToDictionary() : new Dictionary<string, object>()
    };

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddJsonBody(body);
    request.AddHeader("Authorization", $"Bearer {token}");

    RestResponse result = _client.PostAsync(request).Result;
    return result.IsSuccessful;
  }


  public virtual IDictionary<string, object?>? DispositionFormSubmission(string formId, string submissionId, string dispositionStatus, string reason)
  {
    if (String.IsNullOrEmpty(formId))
    {
      throw new ArgumentException("formId cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(submissionId))
    {
      throw new ArgumentException("submissionId cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(dispositionStatus))
    {
      throw new ArgumentException("dispositionStatus cannot be null or empty.");
    }

    Uri formServiceUrl = _directory.GetServiceUrl(AdspPlatformServices.FormServiceId).Result;
    var requestUrl = new Uri(formServiceUrl, $"/form/v1/forms/{formId}/submissions/{submissionId}");
    var token = _getToken().Result;
    var body = new
    {
      dispositionStatus,
      dispositionReason = reason,
    };

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddJsonBody(body);
    request.AddHeader("Authorization", $"Bearer {token}");
    request.AddQueryParameter("tenantId", _tenantId.ToString());

    RestResponse result = _client.PostAsync(request).Result;
    return ParseResponse(result)?.ToDictionary<object?>();
  }


  public virtual IDictionary<string, object?>? HttpGet(string url)
  {
    if (String.IsNullOrEmpty(url))
    {
      throw new ArgumentException("url cannot be null or empty.");
    }

    var token = _getToken().Result;
    var request = new RestRequest(url, Method.Get);
    request.AddHeader("Authorization", $"Bearer {token}");

    RestResponse data = _client.GetAsync(request).Result;
    return ParseResponse(data)?.ToDictionary<object?>();
  }

  public virtual string? CreateTask(
    string queueNamespace, string queueName, string name,
    string? description = null, string? recordId = null, string? priority = null, LuaTable? context = null
  )
  {
    if (String.IsNullOrEmpty(queueNamespace))
    {
      throw new ArgumentException("queueNamespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(queueName))
    {
      throw new ArgumentException("queueName cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.TaskServiceId).Result;
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

    TaskCreationResult? result = _client.PostAsync<TaskCreationResult>(request).Result;
    return result?.Id;
  }

  public virtual IDictionary<string, object>? ReadValue(string @namespace, string name, int top = 10, string? after = null)
  {
    if (String.IsNullOrEmpty(@namespace))
    {
      throw new ArgumentException("namespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ValueServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/value/v1/{@namespace}/values/{name}");
    var token = _getToken().Result;

    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("top", top);
    request.AddQueryParameter("after", after);

    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");

    RestResponse data = _client.GetAsync(request).Result;
    return ParseResponse(data)?.ToDictionary<object>();
  }

  public virtual IDictionary<string, object?>? WriteValue(string @namespace, string name, object? value)
  {
    if (String.IsNullOrEmpty(@namespace))
    {
      throw new ArgumentException("namespace cannot be null or empty.");
    }

    if (String.IsNullOrEmpty(name))
    {
      throw new ArgumentException("name cannot be null or empty.");
    }

    ValueCreateRequest? valueRequest;
    Uri servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ValueServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/value/v1/{@namespace}/values/{name}");
    var token = _getToken().Result;

    if (value is LuaTable luaTable)
    {
      valueRequest = luaTable.ToRequest(@namespace, name);
    }
    else if (value is IDictionary<string, object> dictionary)
    {
      valueRequest = dictionary.ToRequest(@namespace, name);
    }
    else
    {
      throw new ArgumentException("value is not a recognized type.");
    }

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddQueryParameter("tenantId", _tenantId.ToString());
    request.AddHeader("Authorization", $"Bearer {token}");
    request.AddJsonBody(valueRequest);

    // Using generic IDictionary because the value service will return different key values and we
    // can't have specific json property names in our own class.
    return _client.PostAsync<IDictionary<string, object?>?>(request).Result;
  }

  private static JToken? ParseResponse(RestResponse response)
  {
    JToken? value = null;
    if (response?.Content is not null)
    {
      value = JToken.Parse(response.Content);
    }
    return value;
  }
}
