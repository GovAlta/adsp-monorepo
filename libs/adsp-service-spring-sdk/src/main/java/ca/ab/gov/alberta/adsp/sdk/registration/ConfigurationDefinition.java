package ca.ab.gov.alberta.adsp.sdk.registration;

import org.springframework.core.GenericTypeResolver;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.databind.node.ObjectNode;

public abstract class ConfigurationDefinition<T> {

  @JsonIgnore
  private final Class<T> schemaClass;

  private final String description;
  private ObjectNode configurationSchema;

  public String getDescription() {
    return description;
  }

  public Class<T> getSchemaClass() {
    return schemaClass;
  }

  public ObjectNode getConfigurationSchema() {
    return configurationSchema;
  }

  public void setConfigurationSchema(ObjectNode configurationSchema) {
    this.configurationSchema = configurationSchema;
  }

  @SuppressWarnings("unchecked")
  public ConfigurationDefinition(String description) {

    this.description = description;
    this.schemaClass = (Class<T>) GenericTypeResolver.resolveTypeArgument(getClass(), ConfigurationDefinition.class);
  }
}
