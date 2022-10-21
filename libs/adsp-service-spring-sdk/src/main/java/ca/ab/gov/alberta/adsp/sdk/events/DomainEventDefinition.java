package ca.ab.gov.alberta.adsp.sdk.events;

import org.springframework.core.GenericTypeResolver;
import org.springframework.util.Assert;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Definition of a domain event
 */
public abstract class DomainEventDefinition<T> {
  @JsonIgnore
  private final Class<T> payloadClass;

  private final String name;
  private final String description;
  private ObjectNode payloadSchema;

  public Class<T> getPayloadClass() {
    return payloadClass;
  }

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public ObjectNode getPayloadSchema() {
    return payloadSchema;
  }

  public void setPayloadSchema(ObjectNode payloadSchema) {
    this.payloadSchema = payloadSchema;
  }

  /**
   * Create an instance of domain event definition.
   * 
   * @param name        Name of the event definition
   * @param description Description of the event definition
   */
  @SuppressWarnings("unchecked")
  protected DomainEventDefinition(String name, String description) {
    Assert.hasLength(name, "name cannot be null or empty.");

    this.name = name;
    this.description = description;
    this.payloadClass = (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), DomainEventDefinition.class);
  }
}
