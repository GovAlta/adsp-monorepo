package ca.ab.gov.alberta.adsp.sdk.configuration;

import java.util.Optional;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.events.FullDomainEvent;
import ca.ab.gov.alberta.adsp.sdk.socket.SocketEventListener;

public class ConfigurationEventListener {

  private final ConfigurationService configurationService;

  ConfigurationEventListener(ConfigurationService configurationService) {
    this.configurationService = configurationService;
  }

  @SocketEventListener(streamId = "configuration-updates", payloadType = ConfigurationUpdate.class)
  public void OnEvent(FullDomainEvent<ConfigurationUpdate> event) {
    this.configurationService.clearCached(
        AdspId.parse(String.join(
            ":",
            "urn:ads",
            event.getPayload().getNamespace(),
            event.getPayload().getName())),
        Optional.ofNullable(event.getTenantId()));
  }
}
