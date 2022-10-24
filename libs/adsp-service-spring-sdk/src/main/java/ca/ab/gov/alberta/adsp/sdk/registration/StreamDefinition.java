package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.ArrayList;
import java.util.Collection;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Definition of a stream of events that can be accessed via push service
 */
public class StreamDefinition {

  @JsonProperty
  private String id;
  @JsonProperty
  private String name;
  @JsonProperty
  private String description;
  @JsonProperty
  private boolean publicSubscribe;
  @JsonProperty
  private Collection<String> subscriberRoles = new ArrayList<String>();
  @JsonProperty
  private Collection<EventIdentity> events = new ArrayList<EventIdentity>();

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

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public boolean isPublicSubscribe() {
    return publicSubscribe;
  }

  public void setPublicSubscribe(boolean publicSubscribe) {
    this.publicSubscribe = publicSubscribe;
  }

  public Collection<String> getSubscriberRoles() {
    return subscriberRoles;
  }

  public void setSubscriberRoles(Collection<String> subscriberRoles) {
    this.subscriberRoles = subscriberRoles;
  }

  public Collection<?> getEvents() {
    return events;
  }

  public void setEvents(Collection<EventIdentity> events) {
    this.events = events;
  }

  public StreamDefinition(String id, String name) {
    this.setId(id);
    this.setName(name);
  }
}
