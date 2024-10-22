using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using RestSharp;
using Microsoft.Extensions.Options;
using RichardSzalay.MockHttp;
using Moq;
using Xunit;
using Xunit.Abstractions;
using Adsp.Sdk;
using Adsp.Platform.ScriptService.Services.Platform;
using System.Diagnostics;
using System.Text.Json;
using System.Xml.Serialization;
using NLua;

namespace Adsp.Platform.ScriptService.Services;


public class ScriptFunctionsTests
{

  private const string FormId = "my-form";
  private const string SubmissionId = "my-submission";
  private FormSubmissionResult TestData = new FormSubmissionResult
  {
    Id = SubmissionId,
    FormId = FormId,

    // Data = new Dictionary<string, object?>
    //         {
    //             { "firstName", "Bob" },
    //             { "lastName", "Bing" },
    //             { "email", "Bob@bob.com" }
    //         },
    // Files = new Dictionary<string, object?>
    //         {
    //             { "resume", "urn:ads:platform:file-service:v1:/files/resume" },
    //             { "cover", "urn:ads:platform:file-service:v1:/files/cover" }
    //         },
    FormDefinitionId = "job-application",
    Disposition = new FormDisposition
    {
      Status = "rejected",
      Reason = "not good enough",
      Date = DateTime.Now,
    },
    CreatedBy = new Platform.User
    {
      Id = "Bob1234",
      Name = "Bob Bing"
    }
  };

  [Fact]
  public void canSerializeFormSubmissionResult()
  {
    var actual = SerializeFormSubmissionResult(this.TestData);
    var reconstituted = JsonSerializer.Deserialize<FormSubmissionResult>(actual);
    Assert.NotNull(reconstituted);
    Assert.Equal("my-submission", reconstituted.Id);
    Assert.Equal("my-form", reconstituted.FormId);
    // Assert.Equal("Bob", reconstituted.Data["firstName"]);
    // Assert.Equal("urn:ads:platform:file-service:v1:/files/resume", reconstituted.Files["resume"]);
    Assert.NotNull(reconstituted.Disposition);
    Assert.Equal("rejected", reconstituted.Disposition.Status);
  }

  [Fact]
  public void canConvertToLuaTable()
  {
    using var lua = new Lua();
    var actual = this.TestData.ToLuaTable(lua);
    AssertSubmission(actual, SubmissionId, FormId);
  }

  [Fact]
  public void ReturnsValidFormSubmission()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var endpoint = $"/form/v1/forms/{FormId}/submissions/{SubmissionId}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var expected = SerializeFormSubmissionResult(this.TestData);
    using var lua = new Lua();
    using var RestClient = TestUtil.GetRestClient<string>(FormServiceId, endpoint, expected);
    var ScriptFunctions = new ScriptFunctions(FormServiceId, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), lua, RestClient);
    var actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    AssertSubmission(actual, SubmissionId, FormId);
  }

  [Fact]
  public void ReturnsFormSubmissionNotFound()
  {
    var formServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var endpoint = $"/form/v1/forms/{FormId}/submissions/invalid-submission-id";
    var tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var serviceDirectory = TestUtil.GetServiceUrl(formServiceId);
    using var lua = new Lua();

    using var restClient = TestUtil.GetRestClient<string>(formServiceId, endpoint, null);
    var ScriptFunctions = new ScriptFunctions(tenant, TestUtil.GetServiceUrl(formServiceId), TestUtil.GetMockToken(), lua, restClient);
    var actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Null(actual);
  }

  private static void AssertSubmission(LuaTable submission, string SubmissionId, string FormId)
  {
    Assert.NotNull(submission);
    Assert.Equal(SubmissionId, submission["Id"]);
    Assert.Equal(FormId, submission["FormId"]);
    var Disposition = (LuaTable)submission["Disposition"];
    Assert.NotNull(Disposition);
    Assert.Equal("rejected", Disposition["Status"]);
    var Creator = (LuaTable)submission["CreatedBy"];
    Assert.NotNull(Creator);
    Assert.Equal("Bob1234", Creator["Id"]);
    // var files = (LuaTable)submission["Files"];
    // Assert.NotNull(files);
    // Assert.Equal("urn:ads:platform:file-service:v1:/files/resume", files["resume"]);
    // var Data = (LuaTable)submission["Data"];
    // Assert.NotNull(Data);
    // Assert.Equal("Bob", Data["firstName"]);
  }

  private static string SerializeFormSubmissionResult(FormSubmissionResult submission)
  {
    using var memoryStream = new MemoryStream();
    using var writer = new Utf8JsonWriter(memoryStream);
    JsonSerializer.Serialize(writer, submission, typeof(FormSubmissionResult));
    writer.Flush();
    return System.Text.Encoding.UTF8.GetString(memoryStream.ToArray());
  }
}
