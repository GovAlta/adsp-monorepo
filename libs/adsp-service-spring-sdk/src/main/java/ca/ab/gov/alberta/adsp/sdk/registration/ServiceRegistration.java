package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.Arrays;
import java.util.List;

import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;

@SuppressWarnings("rawtypes")
public class ServiceRegistration {
  private final ConfigurationDefinition configuration;
  private final List<ServiceRole> roles;
  private final List<DomainEventDefinition> events;

  public ConfigurationDefinition getConfiguration() {
    return configuration;
  }

  public List<ServiceRole> getRoles() {
    return roles;
  }

  public List<DomainEventDefinition> getEvents() {
    return events;
  }

  private ServiceRegistration(Builder builder) {
    this.configuration = builder.getConfiguration();
    this.roles = builder.getRoles();
    this.events = builder.getEvents();
  }

  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private ConfigurationDefinition configuration;
    private List<ServiceRole> roles;
    private List<DomainEventDefinition> events;

    public ConfigurationDefinition getConfiguration() {
      return configuration;
    }

    public <T> Builder withConfiguration(ConfigurationDefinition<T> configuration) {
      this.configuration = configuration;
      return this;
    }

    public List<ServiceRole> getRoles() {
      return roles;
    }

    public Builder withRoles(ServiceRole... roles) {
      this.roles = Arrays.asList(roles);
      return this;
    }

    public List<DomainEventDefinition> getEvents() {
      return events;
    }

    public Builder withEvents(DomainEventDefinition... events) {
      this.events = Arrays.asList(events);
      return this;
    }

    private Builder() {
    }

    public ServiceRegistration build() {
      return new ServiceRegistration(this);
    }
  }
}
