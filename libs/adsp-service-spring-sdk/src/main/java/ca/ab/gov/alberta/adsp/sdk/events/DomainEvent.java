package ca.ab.gov.alberta.adsp.sdk.events;

import java.time.Instant;

import org.springframework.util.Assert;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Domain event representing some domain significant occurrence
 */
public class DomainEvent<T> {
  @JsonProperty
  private String namespace;

  @JsonProperty
  private String name;

  @JsonProperty
  private Instant timestamp;

  @JsonProperty
  private String correlationId;

  @JsonProperty
  private T payload;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public Instant getTimestamp() {
    return timestamp;
  }

  public void setTimestamp(Instant timestamp) {
    this.timestamp = timestamp;
  }

  String getNamespace() {
    return namespace;
  }

  void setNamespace(String namespace) {
    this.namespace = namespace;
  }

  public String getCorrelationId() {
    return correlationId;
  }

  public void setCorrelationId(String correlationId) {
    this.correlationId = correlationId;
  }

  public T getPayload() {
    return payload;
  }

  public void setPayload(T payload) {
    this.payload = payload;
  }

  public DomainEvent(String name, Instant timestamp, T payload) {
    Assert.hasLength(name, "name cannot be null or empty.");
    Assert.notNull(timestamp, "timestamp cannot be null.");
    Assert.notNull(payload, "payload cannot be null.");

    this.name = name;
    this.timestamp = timestamp;
    this.payload = payload;
  }
}
