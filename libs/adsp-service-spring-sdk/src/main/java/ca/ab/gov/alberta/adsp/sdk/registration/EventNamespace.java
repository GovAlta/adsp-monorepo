package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;

@SuppressWarnings("rawtypes")
class EventNamespace {
  @JsonProperty
  private final String name;
  @JsonProperty
  private final Map<String, DomainEventDefinition> definitions;

  public String getName() {
    return name;
  }

  public Map<String, DomainEventDefinition> getDefinitions() {
    return definitions;
  }

  public EventNamespace(String name, Map<String, DomainEventDefinition> definitions) {
    this.name = name;
    this.definitions = definitions;
  }
}
