package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.List;

import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;

@SuppressWarnings("rawtypes")
class EventNamespace {
  private final String name;
  private final List<DomainEventDefinition> definitions;

  public String getName() {
    return name;
  }

  public List<DomainEventDefinition> getDefinitions() {
    return definitions;
  }

  public EventNamespace(String name, List<DomainEventDefinition> definitions) {
    this.name = name;
    this.definitions = definitions;
  }
}
