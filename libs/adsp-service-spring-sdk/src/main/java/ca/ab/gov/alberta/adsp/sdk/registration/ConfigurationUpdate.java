package ca.ab.gov.alberta.adsp.sdk.registration;

import com.fasterxml.jackson.annotation.JsonProperty;

class ConfigurationUpdate<T> {
  @JsonProperty
  private final String operation = "UPDATE";
  @JsonProperty
  private final T update;

  public String getOperation() {
    return operation;
  }

  public T getUpdate() {
    return update;
  }

  public ConfigurationUpdate(T update) {
    this.update = update;
  }
}
