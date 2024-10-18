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
using Newtonsoft.Json;

namespace Adsp.Platform.ScriptService.Services;

public class ScriptFunctionsTests
{
  [Fact]
  public void canSerializeFormSubmissionResult()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var SubmissionId = "my-submission";
    var endpoint = $"/form/v1/forms/{FormId}/submissions/{SubmissionId}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());
    var submission = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    var Actual = FormSubmissionResult.FromDictionary(submission);
    AssertSubmission(Actual, SubmissionId, FormId);
  }

  // [Fact]
  // [System.Diagnostics.CodeAnalysis.SuppressMessage("Globalization", "CA1303:Do not pass literals as localized parameters", Justification = "Console.WriteLine used for debugging in unit test")]
  // public void canXmlSerializeFormSubmissionResult()
  // {
  //   var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
  //   var FormId = "my-form";
  //   var SubmissionId = "my-submission";
  //   var endpoint = $"/form/v1/forms/{FormId}/submissions/{SubmissionId}";
  //   var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
  //   var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
  //   var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());
  //   var submission = StubFunctions.GetFormSubmission(FormId, SubmissionId);

  //   var serializer = new XmlSerializer(submission.GetType());
  //   using var writer = new StringWriter();
  //   serializer.Serialize(writer, submission.ToLuaTable());
  //   var actual = writer.ToString();

  //   Assert.NotEmpty(actual);
  // }

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

    var testSubmission = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    var Expected = JsonConvert.SerializeObject(testSubmission);
    using var RestClient = TestUtil.GetRestClient<string>(FormServiceId, endpoint, Expected);
    var ScriptFunctions = new ScriptFunctions(FormServiceId, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var submission = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    var Actual = FormSubmissionResult.FromDictionary(submission);
    AssertSubmission(Actual, SubmissionId, FormId);
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

    var testSubmission = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    var Expected = JsonConvert.SerializeObject(testSubmission);
    using var RestClient = TestUtil.GetRestClient<string>(FormServiceId, endpoint, Expected);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Null(Actual);
  }

  private void AssertSubmission(FormSubmissionResult submission, string SubmissionId, string FormId)
  {
    Assert.NotNull(submission);
    Assert.Equal(SubmissionId, submission.Id);
    Assert.Equal(FormId, submission.FormId);
    Assert.NotNull(submission.Disposition);
    var SecurityClassification = submission.Disposition.SecurityClassification;
    Assert.Equal(SecurityClassificationType.ProtectedA, SecurityClassification);
    var Creator = submission.CreatedBy;
    Assert.NotNull(Creator);
    Assert.Equal("Bob1234", Creator.Id);
    Assert.NotNull(submission.Data);
    Assert.Equal("Bob", submission.Data["firstName"]);
  }
}
