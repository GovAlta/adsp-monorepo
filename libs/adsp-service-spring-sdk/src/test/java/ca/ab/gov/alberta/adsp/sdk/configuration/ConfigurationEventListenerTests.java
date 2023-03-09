package ca.ab.gov.alberta.adsp.sdk.configuration;

import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.events.FullDomainEvent;

@ExtendWith(MockitoExtension.class)
class ConfigurationEventListenerTests {
  @Test
  public void canHandleEvent(@Mock ConfigurationService configurationService) {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");
    var update = new ConfigurationUpdate();
    update.setNamespace(serviceId.getNamespace());
    update.setName(serviceId.getService());

    var listener = new ConfigurationEventListener(configurationService);
    listener.OnEvent(
        new FullDomainEvent<ConfigurationUpdate>(tenantId, "test-service", "test-started", Instant.now(),
            update));

    verify(configurationService).clearCached(serviceId, Optional.of(tenantId));
  }
}
