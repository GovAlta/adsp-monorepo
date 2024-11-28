using Xunit;
using Adsp.Sdk;
using NLua;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Adsp.Platform.ScriptService.Services.Util;

namespace Adsp.Platform.ScriptService.Services;

public sealed class ScriptFunctionsTests : IDisposable
{
  private readonly Lua _lua;

  public ScriptFunctionsTests()
  {
    _lua = new Lua();
  }

  // Implement IDisposable for teardown (runs after each test)
  public void Dispose()
  {
    _lua.Dispose();
  }

  [Fact]
  public void ReturnsValidFormSubmission()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var SubmissionId = "my-submission";
    var endpoint = $"/form/v1/forms/{FormId}/submissions/{SubmissionId}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());

    var Expected = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    using var RestClient = TestUtil.GetRestClient(FormServiceId, endpoint, HttpMethod.Get, Expected);
    var ScriptFunctions = new ScriptFunctions(FormServiceId, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Equal(SubmissionId, Actual?.id);
    Assert.Equal(FormId, Actual?.formId);
  }

  [Fact]
  public void ReturnsFormSubmissionNotFound()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var SubmissionId = "my-submission";
    var endpoint = $"/form/v1/forms/{FormId}/submissions/invalid-submission-id";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());

    var Expected = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    using var RestClient = TestUtil.GetRestClient(FormServiceId, endpoint, HttpMethod.Get, Expected);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Null(Actual);
  }

  [Fact]
  public void CanSendDomainEvent()
  {
    var EventServiceId = AdspId.Parse("urn:ads:platform:event-service");
    var endpoint = "/event/v1/events";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(EventServiceId);

    using var RestClient = TestUtil.GetRestClientToInspectBody(
      EventServiceId,
      endpoint,
      HttpMethod.Post,
      true,
      (r) =>
      {
        var result = r!;
        var body = JsonConvert.DeserializeObject<JToken>(result)?.ToDictionary<object>();
        Assert.NotNull(body);
        Assert.IsType<Dictionary<string, object>>(body);
        var payload = body!["payload"];
        Assert.Equal("Bob Bing", ((Dictionary<string, object>)payload)["name"]);
      }
    );
    var ScriptFunctions = new ScriptFunctions(EventServiceId, TestUtil.GetServiceUrl(EventServiceId), TestUtil.GetMockToken(), RestClient);
    _lua.DoString("payload = { name = 'Bob Bing', emailAddress = 'bob@bob.com' }");
    LuaTable payload = (LuaTable)_lua["payload"];
    var Actual = ScriptFunctions.SendDomainEvent("namespace", "name", null, null, payload);
    Assert.True(Actual);
  }

  [Fact]
  public void CanWriteComplexValue()
  {
    var ValueServiceId = AdspId.Parse("urn:ads:platform:value-service");
    var _namespace = "my-space";
    var name = "my-test";
    var endpoint = $"/value/v1/{_namespace}/values/{name}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(ValueServiceId);

    using var RestClient = TestUtil.GetRestClientToInspectBody(ValueServiceId, endpoint, HttpMethod.Post, null,
      (b) =>
      {
        var body = JsonConvert.DeserializeObject<JToken>(b!)?.ToDictionary<object>();
        Assert.Equal("my-space", body!["namespace"]);
        Assert.Equal("my-test", body["name"]);
        Assert.Equal("", body["correlationId"]);
        var context = body["context"];
        Assert.NotNull(context);
        var foo = context!.GetType();
        Assert.True(context!.GetType() == typeof(Dictionary<string, object>));
        Assert.True(((IDictionary<string, object>)context).Count == 0);
        var value = body["value"];
        Assert.NotNull(value);
        Assert.True(value!.GetType() == typeof(Dictionary<string, object>));
        Assert.True(((Dictionary<string, object?>)value).Count == 1);
        var index = ((Dictionary<string, object?>)value)["index"];
        Assert.NotNull(index);
        Assert.True(index!.GetType() == typeof(List<object>));
        Assert.True(((List<object>)index).Count == 3);
      }
);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(ValueServiceId), TestUtil.GetMockToken(), RestClient);
    _lua.DoString("theValue = { value = {index = {'Idx1', 'Idx2', 'Idx3'}}, context={}, correlationId='' }");
    LuaTable value = (LuaTable)_lua["theValue"];
    var Actual = ScriptFunctions.WriteValue(_namespace, name, value);
    Assert.Null(Actual);
  }

  [Fact]
  public void ReadsValueCorrectly()
  {
    var ValueServiceId = AdspId.Parse("urn:ads:platform:value-service");
    var _namespace = "mySpace";
    var name = "myTest";
    var endpoint = $"/value/v1/{_namespace}/values/{name}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(ValueServiceId);

    var expected = new Dictionary<string, object>()
    {
      [_namespace] = new Dictionary<string, object>()
      {
        [name] = new[]
        {
          new Dictionary<string, object>()
          {
            ["context"] = "{}",
            ["correlationId"] = "bob",
            ["value"] = new Dictionary<string, object>()
            {
              ["index"] = new[] {"idx1", "idx2"}
            }
          }
        }
      }
    };

    using var RestClient = TestUtil.GetRestClient(ValueServiceId, endpoint, HttpMethod.Get, expected);
    var ScriptFunctions = new ScriptFunctions(ValueServiceId, TestUtil.GetServiceUrl(ValueServiceId), TestUtil.GetMockToken(), RestClient);
    var actual = ScriptFunctions.ReadValue(_namespace, name, 1);
    Assert.NotNull(actual);
    Assert.True(actual!.GetType() == typeof(Dictionary<string, object>));
    Assert.True(actual![_namespace].GetType() == typeof(Dictionary<string, object>));
    var myTest = ((Dictionary<string, object?>)actual![_namespace])[name];
    Assert.True(myTest!.GetType() == typeof(List<object>));
    var value = ((List<object>)myTest)[0];
    Assert.True(value.GetType() == typeof(Dictionary<string, object>));
    Assert.Equal("bob", ((Dictionary<string, object>)value)["correlationId"]);
    var valueValue = ((Dictionary<string, object>)value)["value"];
    Assert.True(valueValue.GetType() == typeof(Dictionary<string, object>));
    var index = ((Dictionary<string, object>)valueValue)["index"];
    Assert.True(index.GetType() == typeof(List<object>));
    var items = (List<object>)index;
    Assert.True(items[0].GetType() == typeof(string));
    Assert.Equal("idx1", (string)items[0]);
  }

  [Fact]
  public void CanGetFormDataWithLists()
  {
    var data = @"
      {
        ""id"": ""a869b024-55d1-45e8-8380-7bfae7d0f534"",
        ""data"": {
          ""inventory"": [
              {
                ""product"": ""Clothing""
              },
              {
                ""product"": ""Junk""
              },
              {
                ""product"": ""Food""
              }
          ],
          ""appId"": ""another-app-id"",
          ""serviceName"": ""Three Generator"",
          ""editorName"": ""Bob"",
          ""editorEmail"": ""roy.styan@gov.ab.ca""
        },
        ""files"": {
          ""fileName"": ""fileURN""
        }
      }";
    var expected = JObject.Parse(data);

    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var endpoint = $"/form/v1/forms/{FormId}/data";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    IServiceDirectory ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    using RestSharp.IRestClient RestClient = TestUtil.GetRestClient(FormServiceId, endpoint, HttpMethod.Get, expected);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    Platform.FormDataResult? actual = ScriptFunctions.GetFormData(FormId);
    Assert.NotNull(actual);
    Assert.NotNull(actual?.data);
    Assert.NotNull(actual?.data?["inventory"]);
    Assert.Equal(3, ((List<object>)actual?.data?["inventory"]!).Count);
    Assert.Equal(1, actual.files!.Count);
  }

  [Fact]
  public void CanGetConfiguration()
  {
    var data = @"
    {
      ""urn"": ""urn:ads:platform:configuration-service:v2:/configuration/platform/feedback-service"",
      ""namespace"": ""platform"",
      ""name"": ""feedback-service"",
      ""latest"": {
        ""revision"": 0,
        ""created"": ""2024-07-29T20:15:04.558Z"",
        ""lastUpdated"": ""2024-08-08T21:41:19.115Z"",
        ""configuration"": {
          ""sites"": [
            {
              ""url"": ""https://common-capabilities-dcp-uat.apps.aro.gov.ab.ca"",
              ""allowAnonymous"": true
            },
            {
              ""url"": ""https://digital-standards-dcp-uat.apps.aro.gov.ab.ca"",
              ""allowAnonymous"": true
            }
          ]
        }
      },
      ""active"": null
    }";
    var expected = JObject.Parse(data);
    var _namespace = "namespace";
    var name = "name";
    var configurationServiceId = AdspId.Parse("urn:ads:platform:configuration-service");
    var endpoint = $"/configuration/v2/configuration/{_namespace}/{name}/active";
    var tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    IServiceDirectory ServiceDirectory = TestUtil.GetServiceUrl(configurationServiceId);
    using RestSharp.IRestClient RestClient = TestUtil.GetRestClient(configurationServiceId, endpoint, HttpMethod.Get, expected);
    var ScriptFunctions = new ScriptFunctions(tenant, TestUtil.GetServiceUrl(configurationServiceId), TestUtil.GetMockToken(), RestClient);
    IDictionary<string, object?>? actual = ScriptFunctions.GetConfiguration(_namespace, name);
    Assert.NotNull(actual);
    var latest = (IDictionary<string, object>)actual!["latest"]!;
    Assert.NotNull(latest);
    var configuration = (IDictionary<string, object>)latest["configuration"];
    Assert.NotNull(configuration);
    var sites = (List<object>)configuration["sites"];
    Assert.NotNull(sites);
    Assert.Equal(2, sites.Count);
  }

  [Fact]
  public void CanDispositionForm()
  {
    var data = @"
      {
        ""urn"": ""urn:ads:platform:form-service:v1:/forms/e78378d6-43c3-494b-9641-accdfd02a4d0/submissions/207291bd-3877-4196-91af-934590ad0d28"",
        ""id"": ""207291bd-3877-4196-91af-934590ad0d28"",
        ""formId"": ""e78378d6-43c3-494b-9641-accdfd02a4d0"",
        ""formDefinitionId"": ""a-form-for-script-testing"",
        ""formData"": {
          ""appId"": ""22-frosty-penguins"",
          ""serviceName"": ""Bob's house of penguins"",
          ""editorName"": ""Bob"",
          ""editorEmail"": ""bob@bob.com"",
          ""inventory"": [
            {
              ""product"": ""Tuxes""
            },
            {
              ""product"": ""Bow Ties""
            },
            {
              ""product"": ""cummerbunds""
            }
          ]
        },
        ""formFiles"": {},
        ""created"": ""2024-11-27T15:35:53.017Z"",
        ""createdBy"": {
          ""id"": ""f5f11695-a7c2-405a-8121-5479a8a1205c"",
          ""name"": ""service-account-postman""
        },
        ""securityClassification"": ""protected b"",
        ""disposition"": null,
        ""updated"": ""2024-11-27T15:35:53.017Z"",
        ""updatedBy"": {
          ""id"": ""f5f11695-a7c2-405a-8121-5479a8a1205c"",
          ""name"": ""service-account-postman""
        },
        ""hash"": ""52524f9d178eef5457e0cc005aeb01f46bd2a7b8""
    }";
    var expected = JObject.Parse(data);
    var formId = "e78378d6-43c3-494b-9641-accdfd02a4d0";
    var submissionId = "207291bd-3877-4196-91af-934590ad0d28";
    var status = "accepted";
    var reason = "because";
    var formServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var endpoint = $"/form/v1/forms/{formId}/submissions/{submissionId}";
    var tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    IServiceDirectory ServiceDirectory = TestUtil.GetServiceUrl(formServiceId);
    using RestSharp.IRestClient RestClient = TestUtil.GetRestClient(formServiceId, endpoint, HttpMethod.Post, expected);
    var ScriptFunctions = new ScriptFunctions(tenant, TestUtil.GetServiceUrl(formServiceId), TestUtil.GetMockToken(), RestClient);
    IDictionary<string, object?>? actual = ScriptFunctions.DispositionFormSubmission(formId, submissionId, status, reason);
    Assert.NotNull(actual);
    Assert.Equal("207291bd-3877-4196-91af-934590ad0d28", actual!["id"]);
    var actualData = (IDictionary<string, object?>?)actual["formData"];
    Assert.NotNull(actualData);
    var inventory = actualData!["inventory"];
    Assert.NotNull(inventory);
    Assert.Equal(3, ((List<object>)inventory!).Count());
  }

  [Fact]
  public void CanCallApi()
  {
    var data = @"
      {
        ""firstName"": ""Bob"",
        ""lastName"": ""Bing"",
        ""middleName"": ""Billy"",
        ""otherName"": ""Bob""
    }";
    var expected = JObject.Parse(data);
    var serviceId = AdspId.Parse("urn:ads:platform:my-service");
    var endpoint = "https://bob.com/bob/v2/bobs";
    var tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    IServiceDirectory ServiceDirectory = TestUtil.GetServiceUrl(serviceId);
    using RestSharp.IRestClient RestClient = TestUtil.GetRestClient(serviceId, endpoint, HttpMethod.Get, expected);
    var ScriptFunctions = new ScriptFunctions(tenant, TestUtil.GetServiceUrl(serviceId), TestUtil.GetMockToken(), RestClient);
    IDictionary<string, object?>? actual = ScriptFunctions.HttpGet(endpoint);
    Assert.NotNull(actual);
    Assert.Equal("Bob", actual!["firstName"]);
    Assert.Equal("Bing", actual!["lastName"]);
  }
}

