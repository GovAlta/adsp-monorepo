using RestSharp;
using RichardSzalay.MockHttp;
using Moq;
using Newtonsoft.Json;
using Adsp.Sdk;
using System.Text;

namespace Adsp.Platform.ScriptService.Services;

internal static class TestUtil
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
    var mockedHttpResponse = JsonConvert.SerializeObject(expectedResult, Formatting.None);
    IServiceDirectory ServiceDirectory = GetServiceUrl(serviceId);
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
  Action<string?> assert
)
  {
    using var mockHttp = new MockHttpMessageHandler();
    var ServiceDirectory = GetServiceUrl(serviceId);
    var requestUrl = new Uri(ServiceDirectory.GetServiceUrl(serviceId).Result, endpoint);

    var handler = mockHttp.When(method, requestUrl.AbsoluteUri);
    handler.Respond(req =>
     {
       var body = req.Content?.ReadAsStringAsync().Result;
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
}
