package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.ArrayList;
import java.util.Collection;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Type of file including roles allowed to read and/or update.
 */
public class FileType {
  @JsonProperty
  private String id;
  @JsonProperty
  private String name;
  @JsonProperty
  private boolean anonymousRead;
  @JsonProperty
  private Collection<String> readRoles = new ArrayList<String>();
  @JsonProperty
  private Collection<String> updateRoles = new ArrayList<String>();

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public boolean isAnonymousRead() {
    return anonymousRead;
  }

  public void setAnonymousRead(boolean anonymousRead) {
    this.anonymousRead = anonymousRead;
  }

  public Collection<String> getReadRoles() {
    return readRoles;
  }

  public void setReadRoles(Collection<String> readRoles) {
    this.readRoles = readRoles;
  }

  public Collection<String> getUpdateRoles() {
    return updateRoles;
  }

  public void setUpdateRoles(Collection<String> updateRoles) {
    this.updateRoles = updateRoles;
  }

  public FileType(String id, String name) {
    this.setId(id);
    this.setName(name);
  }
}
