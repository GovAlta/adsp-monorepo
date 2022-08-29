using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;
using RestSharp;
using Microsoft.Extensions.Options;
using RichardSzalay.MockHttp;
using Moq;
using Xunit;
using Newtonsoft.Json.Linq;

namespace Adsp.Sdk.Configuration;
public class ConfigurationUpdateTests
{
  [Fact]
  public void ConfigurationUpdatePayloadClass()
  {
    var payload = new ConfigurationUpdatePayload();
    payload.Name = "test";
    payload.Namespace = "testNamespace";

    payload.Name.Should().Be("test");
    payload.Namespace.Should().Be("testNamespace");
  }

  [Fact]
  public void ConfigurationUpdateClass()
  {
    var tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");
    var service = new ConfigurationUpdate();
    service.TenantId = tenantId;
    var payload = new ConfigurationUpdatePayload();
    payload.Name = "test";
    payload.Namespace = "testNamespace";

    service.Payload = payload;

    service.TenantId.Should().Be(tenantId);
    service.Payload.Name.Should().Be("test");
    service.Payload.Namespace.Should().Be("testNamespace");
  }
}
