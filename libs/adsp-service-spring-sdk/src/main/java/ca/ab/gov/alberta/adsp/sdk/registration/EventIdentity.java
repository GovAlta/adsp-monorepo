package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EventIdentity {
  @JsonProperty
  private String namespace;
  @JsonProperty
  private String name;
  @JsonProperty
  private EventIdentityCriteria criteria;

  public String getNamespace() {
    return namespace;
  }

  public void setNamespace(String namespace) {
    this.namespace = namespace;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public EventIdentityCriteria getCriteria() {
    return criteria;
  }

  public void setCriteria(EventIdentityCriteria criteria) {
    this.criteria = criteria;
  }

  public EventIdentity(String namespace, String name) {
    this.setNamespace(namespace);
    this.setName(name);
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class EventIdentityCriteria {
    @JsonProperty
    private String correlationId;
    @JsonProperty
    private Map<String, Object> context = new HashMap<String, Object>();

    public String getCorrelationId() {
      return correlationId;
    }

    public void setCorrelationId(String correlationId) {
      this.correlationId = correlationId;
    }

    public Map<String, Object> getContext() {
      return context;
    }

    public void setContext(Map<String, Object> context) {
      this.context = context;
    }
  }
}
