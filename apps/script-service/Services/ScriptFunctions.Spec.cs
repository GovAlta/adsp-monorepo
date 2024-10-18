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
using System.Text.Json;
using System.Xml.Serialization;
using Adsp.Sdk;
using Adsp.Platform.ScriptService.Services.Platform;
using System.Diagnostics;

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

    var jsonSubmission = JsonSerializer.Serialize(submission);
    Assert.NotNull(jsonSubmission);
  }

  [Fact]
  [System.Diagnostics.CodeAnalysis.SuppressMessage("Globalization", "CA1303:Do not pass literals as localized parameters", Justification = "Console.WriteLine used for debugging in unit test")]
  public void canXmlSerializeFormSubmissionResult()
  {
    var FormServiceId = AdspId.Parse("urn:ads:platform:form-service");
    var FormId = "my-form";
    var SubmissionId = "my-submission";
    var endpoint = $"/form/v1/forms/{FormId}/submissions/{SubmissionId}";
    var Tenant = AdspId.Parse("urn:ads:platform:my-tenant");
    var ServiceDirectory = TestUtil.GetServiceUrl(FormServiceId);
    var StubFunctions = new StubScriptFunctions(Tenant, ServiceDirectory, TestUtil.GetMockToken());
    var submission = StubFunctions.GetFormSubmission(FormId, SubmissionId);

    var serializer = new XmlSerializer(submission.GetType());
    using var writer = new StringWriter();
    serializer.Serialize(writer, submission);
    var actual = writer.ToString();

    Assert.NotEmpty(actual);
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

    var submission = StubFunctions.GetFormSubmission(FormId, SubmissionId);
    var Expected = JsonSerializer.Serialize(submission);
    using var RestClient = TestUtil.GetRestClient<FormSubmissionResult>(FormServiceId, endpoint, Expected);
    var ScriptFunctions = new ScriptFunctions(FormServiceId, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Equal(SubmissionId, Actual?.Id);
    Assert.Equal(FormId, Actual?.FormId);
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
    using var RestClient = TestUtil.GetRestClient<FormSubmissionResult>(FormServiceId, endpoint, Expected);
    var ScriptFunctions = new ScriptFunctions(Tenant, TestUtil.GetServiceUrl(FormServiceId), TestUtil.GetMockToken(), RestClient);
    var Actual = ScriptFunctions.GetFormSubmission(FormId, SubmissionId);
    Assert.Null(Actual);
  }
}
