using RestSharp;
using RichardSzalay.MockHttp;
using Moq;
using Newtonsoft.Json;
using Adsp.Sdk;
using System.Text;
using Newtonsoft.Json.Linq;
using System.Runtime.CompilerServices;

namespace Adsp.Platform.ScriptService.Services;

#pragma warning disable CA1062 // Its just test code.
public static class TestUtil
{
  public static IServiceDirectory GetServiceUrl(AdspId serviceId)
  {
    Uri ServiceApi = new($"https://{serviceId.Service}.adsp.alberta.ca");
    Mock<IServiceDirectory> MockServiceDirectory = new();
    MockServiceDirectory.Setup(service => service.GetServiceUrl(It.IsAny<AdspId>())).ReturnsAsync(ServiceApi);
    return MockServiceDirectory.Object;
  }
  public static Func<Task<string>> GetMockToken()
  {
    string token = "I am an access token";
    Mock<Func<Task<string>>> MockTokenGetter = new();
    MockTokenGetter.Setup(getter => getter()).ReturnsAsync(token);
    return MockTokenGetter.Object;
  }

  public static IRestClient GetRestClient(
    AdspId serviceId,
    string endpoint,
    HttpMethod method,
    object? expectedResult = null,
    bool success = true
  )
  {
    using var mockHttp = new MockHttpMessageHandler();
    string mockedHttpResponse = JsonConvert.SerializeObject(expectedResult, Formatting.None);
    var ServiceDirectory = GetServiceUrl(serviceId);
    var requestUrl = new Uri(ServiceDirectory.GetServiceUrl(serviceId).Result, endpoint);

    var handler = mockHttp.When(method, requestUrl.AbsoluteUri);
    if (success)
    {
      handler.Respond(
         "application/json",
         mockedHttpResponse
       );
    }
    else
    {
      handler.Throw(new HttpRequestException("404 (Not Found)"));
    }

    var mockRestClient = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    return mockRestClient;
  }

  public static IRestClient GetRestClientToInspectBody(
  AdspId serviceId,
  string endpoint,
  HttpMethod method,
  object? expectedResult,
  Action<string> assert
)
  {
    using var mockHttp = new MockHttpMessageHandler();
    var ServiceDirectory = GetServiceUrl(serviceId);
    var requestUrl = new Uri(ServiceDirectory.GetServiceUrl(serviceId).Result, endpoint);

    var handler = mockHttp.When(method, requestUrl.AbsoluteUri);
    handler.Respond(req =>
     {
       var body = req.Content.ReadAsStringAsync().Result;
       assert(body);
       string mockedHttpResponse = JsonConvert.SerializeObject(expectedResult, Formatting.None);
       return new HttpResponseMessage(System.Net.HttpStatusCode.OK)
       {
         Content = new StringContent(mockedHttpResponse, Encoding.UTF8, "application/json")
       };
     });

    var mockRestClient = new RestClient(
      new RestClientOptions
      {
        BaseUrl = requestUrl,
        ConfigureMessageHandler = _ => mockHttp
      }
    );

    return mockRestClient;
  }

  public static Dictionary<string, object>? ToDictionary(this JToken token)
  {
    if (token != null && token is JObject item)
    {
      return (Dictionary<string, object>)DictionaryHelper(item);
    }
    return null;
  }

  public static object DictionaryHelper(JToken token)
  {
    if (token is JObject jObject)
    {
      var result = new Dictionary<string, object>();
      foreach (var property in jObject.Properties())
      {
        result[property.Name] = DictionaryHelper(property.Value);
      }
      return result;
    }
    else if (token is JArray jArray)
    {
      var items = new List<object>();
      foreach (var item in jArray)
      {
        items.Add(DictionaryHelper(item));
      }
      return items;
    }
    else if (token is JValue jValue)
    {
      return jValue.Value;
    }

    return null;
  }
}
