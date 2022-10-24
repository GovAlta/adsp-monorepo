package ca.ab.gov.alberta.adsp.sdk.events;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import ca.ab.gov.alberta.adsp.sdk.AdspId;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FullDomainEvent<T> extends DomainEvent<T> {

  @JsonProperty
  private AdspId tenantId;

  @JsonProperty
  private String namespace;

  public AdspId getTenantId() {
    return tenantId;
  }

  public void setTenantId(AdspId tenantId) {
    this.tenantId = tenantId;
  }

  public String getNamespace() {
    return namespace;
  }

  public void setNamespace(String namespace) {
    this.namespace = namespace;
  }

  public FullDomainEvent(AdspId tenantId, String namespace, String name, Instant timestamp, T payload) {
    super(name, timestamp, payload);
    this.tenantId = tenantId;
    this.namespace = namespace;
  }

}
