using FluentAssertions;
using Xunit;

namespace Adsp.Sdk;
public class AdspIdTests
{
  [Fact]
  public void CanParseResource()
  {
    var parsed = AdspId.parse("urn:ads:test:test-service:v2:/resources/resource");

    parsed.Type.Should().Be(ResourceType.Resource);
    parsed.Namespace.Should().Be("test");
    parsed.Service.Should().Be("test-service");
    parsed.Api.Should().Be("v2");
    parsed.Resource.Should().Be("/resources/resource");
  }

  [Fact]
  public void CanParseApi()
  {
    var parsed = AdspId.parse("urn:ads:test:test-service:v2");

    parsed.Type.Should().Be(ResourceType.Api);
    parsed.Namespace.Should().Be("test");
    parsed.Service.Should().Be("test-service");
    parsed.Api.Should().Be("v2");
    parsed.Resource.Should().BeNullOrEmpty();
  }

  [Fact]
  public void CanParseService()
  {
    var parsed = AdspId.parse("urn:ads:test:test-service");

    parsed.Type.Should().Be(ResourceType.Service);
    parsed.Namespace.Should().Be("test");
    parsed.Service.Should().Be("test-service");
    parsed.Api.Should().BeNullOrEmpty();
    parsed.Resource.Should().BeNullOrEmpty();
  }

  [Fact]
  public void CanParseNamespace()
  {
    var parsed = AdspId.parse("urn:ads:test");

    parsed.Type.Should().Be(ResourceType.Namespace);
    parsed.Namespace.Should().Be("test");
    parsed.Service.Should().BeNullOrEmpty();
    parsed.Api.Should().BeNullOrEmpty();
    parsed.Resource.Should().BeNullOrEmpty();
  }

  [Fact]
  public void CanFailForWrongNid()
  {
    var parse = () => AdspId.parse("wrong:ads:test");
    parse.Should().Throw<ArgumentException>();
  }

  [Fact]
  public void CanFailForWrongNss()
  {
    var parse = () => AdspId.parse("urn:wrong:test");
    parse.Should().Throw<ArgumentException>();
  }

  [Fact]
  public void CanFailForMalformed()
  {
    var parse = () => AdspId.parse("urn:ads:test:");
    parse.Should().Throw<ArgumentException>();
  }
}
