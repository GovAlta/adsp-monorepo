using RestSharp;
using RichardSzalay.MockHttp;
using Moq;
using Newtonsoft.Json;
using Adsp.Sdk;

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

  public static IRestClient GetRestClient<T>(AdspId serviceId, string endpoint, Object expectedResult, bool success = true)
  {
    using var mockHttp = new MockHttpMessageHandler();
    string mockedHttpResponse = JsonConvert.SerializeObject(expectedResult, Formatting.None);
    var ServiceDirectory = GetServiceUrl(serviceId);
    var requestUrl = new Uri(ServiceDirectory.GetServiceUrl(serviceId).Result, endpoint);

    var handler = mockHttp.When(HttpMethod.Get, requestUrl.AbsoluteUri);
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
}
