using Adsp.Sdk.Events;
using FluentAssertions;
using Xunit;

namespace Adsp.Sdk.Amqp;

public class AmqpExtensionTests
{
  private readonly AdspId tenantId = AdspId.Parse("urn:ads:platform:tenant-service:v2:/tenants/test");

  [Fact]
  public void CanMatchEvent()
  {
    var identity = new EventIdentity("test-service", "test-started");
    var matchEvent = new FullDomainEvent<IDictionary<string, object>>(tenantId, "test-service", "test-started", DateTime.Now, new Dictionary<string, object>());
    identity.IsMatch(matchEvent).Should().BeTrue();

    var notMatchEvent = new FullDomainEvent<IDictionary<string, object>>(tenantId, "test-service", "test-ended", DateTime.Now, new Dictionary<string, object>());
    identity.IsMatch(notMatchEvent).Should().BeFalse();
  }

  [Fact]
  public void CanMatchEventWithEmptyContextCriteria()
  {
    var identity = new EventIdentity("test-service", "test-started") { Criteria = new EventIdentityCriteria { Context = new Dictionary<string, object>() } };
    var matchEvent = new FullDomainEvent<IDictionary<string, object>>(
      tenantId, "test-service", "test-started", DateTime.Now, new Dictionary<string, object>(), null, new Dictionary<string, object>()
    );
    identity.IsMatch(matchEvent).Should().BeTrue();
  }

  [Fact]
  public void CanMatchEventWithContextCriteria()
  {
    var identity = new EventIdentity("test-service", "test-started")
    {
      Criteria = new EventIdentityCriteria
      {
        Context = new Dictionary<string, object> { { "keyA", "valueA" } }
      }
    };
    var matchEvent = new FullDomainEvent<IDictionary<string, object>>(
      tenantId, "test-service", "test-started", DateTime.Now, new Dictionary<string, object>(), null, new Dictionary<string, object> { { "keyA", "valueA" } }
    );
    identity.IsMatch(matchEvent).Should().BeTrue();

    var notContextEvent = new FullDomainEvent<IDictionary<string, object>>(tenantId, "test-service", "test-started", DateTime.Now, new Dictionary<string, object>());
    identity.IsMatch(notContextEvent).Should().BeFalse();

    var wrongValueEvent = new FullDomainEvent<IDictionary<string, object>>(
      tenantId, "test-service", "test-started", DateTime.Now, new Dictionary<string, object> { { "keyA", "valueB" } }
    );
    identity.IsMatch(wrongValueEvent).Should().BeFalse();
  }
}
