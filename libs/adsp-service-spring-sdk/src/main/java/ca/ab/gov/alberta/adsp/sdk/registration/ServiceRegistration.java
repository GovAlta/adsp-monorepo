package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.Arrays;
import java.util.List;

import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;

/**
 * <p>
 * Registrations for the service
 * </p>
 *
 * <p>
 * Registration configures platform capabilities with service defined elements
 * such as domain events and configuration schema.
 * </p>
 */
@SuppressWarnings("rawtypes")
public class ServiceRegistration {
  private final ConfigurationDefinition configuration;
  private final List<ServiceRole> roles;
  private final List<DomainEventDefinition> events;
  private final List<FileType> fileTypes;
  private final List<StreamDefinition> streams;

  public ConfigurationDefinition getConfiguration() {
    return configuration;
  }

  public List<ServiceRole> getRoles() {
    return roles;
  }

  public List<DomainEventDefinition> getEvents() {
    return events;
  }

  public List<FileType> getFileTypes() {
    return fileTypes;
  }

  public List<StreamDefinition> getStreams() {
    return streams;
  }

  private ServiceRegistration(Builder builder) {
    this.configuration = builder.getConfiguration();
    this.roles = builder.getRoles();
    this.events = builder.getEvents();
    this.fileTypes = builder.getFileTypes();
    this.streams = builder.getStreams();
  }

  /**
   * Initialize a builder for ServiceRegistration.
   *
   * @return Builder for ServiceRegistration
   */
  public static Builder builder() {
    return new Builder();
  }

  public static class Builder {
    private ConfigurationDefinition configuration;
    private List<ServiceRole> roles;
    private List<DomainEventDefinition> events;
    private List<FileType> fileTypes;
    private List<StreamDefinition> streams;

    public ConfigurationDefinition getConfiguration() {
      return configuration;
    }

    /**
     * Set the configuration definition to register
     *
     * @param <T>           Type of configuration object
     * @param configuration Configuration definition to register
     * @return Builder
     */
    public <T> Builder withConfiguration(ConfigurationDefinition<T> configuration) {
      this.configuration = configuration;
      return this;
    }

    public List<ServiceRole> getRoles() {
      return roles;
    }

    /**
     * Set the service role to register
     *
     * @param roles Service roles to register
     * @return Builder
     */
    public Builder withRoles(ServiceRole... roles) {
      this.roles = Arrays.asList(roles);
      return this;
    }

    public List<DomainEventDefinition> getEvents() {
      return events;
    }

    /**
     * Set the domain event definitions to register
     *
     * @param events Domain event definitions to register
     * @return Builder
     */
    public Builder withEvents(DomainEventDefinition... events) {
      this.events = Arrays.asList(events);
      return this;
    }

    public List<FileType> getFileTypes() {
      return fileTypes;
    }

    /**
     * Set the file types to register
     *
     * @param fileTypes File types to register
     * @return Builder
     */
    public Builder withFileTypes(FileType... fileTypes) {
      this.fileTypes = Arrays.asList(fileTypes);
      return this;
    }

    public List<StreamDefinition> getStreams() {
      return streams;
    }

    /**
     * Set the stream definitions to register
     * 
     * @param streams Stream definitions to register
     * @return Builder
     */
    public Builder withStreams(StreamDefinition... streams) {
      this.streams = Arrays.asList(streams);
      return this;
    }

    private Builder() {
    }

    /**
     * Build service registration
     *
     * @return ServiceRegistration
     */
    public ServiceRegistration build() {
      return new ServiceRegistration(this);
    }
  }
}
