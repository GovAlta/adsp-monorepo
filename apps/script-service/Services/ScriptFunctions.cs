using Adsp.Platform.ScriptService.Services.Platform;
using Adsp.Platform.ScriptService.Services.Util;
using Adsp.Sdk;
using NLua;
using RestSharp;

namespace Adsp.Platform.ScriptService.Services;
internal class ScriptFunctions
{
  private readonly IServiceDirectory _directory;
  private readonly string? _token;
  private readonly RestClient _client;

  public ScriptFunctions(IServiceDirectory directory, string? token, RestClient? client = null)
  {
    _directory = directory;
    _token = token;
    _client = client ?? new RestClient();
  }

  public string? GeneratePdf(string templateId, string filename, LuaTable values)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.PdfServiceId).Result;
    var requestUrl = new Uri(servicesUrl, "/pdf/v1/jobs");

    var request = new RestRequest(requestUrl, Method.Post);
    request.AddHeader("Authorization", $"Bearer {_token}");

    var generationRequest = new PdfGenerationRequest
    {
      TemplateId = templateId,
      FileName = filename,
      Data = values.ToDictionary(),
    };

    request.AddJsonBody(generationRequest);

    var result = _client.PostAsync<PdfGenerationResult>(request).Result;
    return result?.Id;
  }

  public IDictionary<string, object?>? GetConfiguration(string @namespace, string name)
  {
    var servicesUrl = _directory.GetServiceUrl(AdspPlatformServices.ConfigurationServiceId).Result;
    var requestUrl = new Uri(servicesUrl, $"/configuration/v2/configuration/{@namespace}/{name}/active");

    var request = new RestRequest(requestUrl, Method.Get);
    request.AddQueryParameter("orLatest", "true");
    request.AddHeader("Authorization", $"Bearer {_token}");

    var result = _client.GetAsync<ConfigurationResult>(request).Result;
    return result?.Configuration;
  }
}
