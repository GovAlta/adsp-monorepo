package ca.ab.gov.alberta.adsp.sdk;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.springframework.util.Assert;
import org.springframework.util.ObjectUtils;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import ca.ab.gov.alberta.adsp.sdk.utils.AdspIdDeserializer;

@JsonDeserialize(using = AdspIdDeserializer.class)
public final class AdspId {
  private static final Pattern UrnPattern = Pattern.compile(
      "^(?i:urn):ads(?<namespace>:[a-zA-Z0-9-]{1,50})(?<service>:[a-zA-Z0-9-]{1,50})?(?<api>:[a-zA-Z0-9-]{1,50})?(?<resource>:[a-zA-Z0-9-_/ ]{1,1000})?$");

  public static AdspId parse(String urn) {
    Assert.hasLength(urn, "urn cannot be null or empty.");

    Matcher matcher = UrnPattern.matcher(urn);

    if (!matcher.find()) {
      throw new IllegalArgumentException("Specified urn is not an ADSP ID.");
    }

    var namespace = StringUtils.strip(matcher.group("namespace"), ":");
    var service = StringUtils.strip(matcher.group("service"), ":");
    var api = StringUtils.strip(matcher.group("api"), ":");
    var resource = StringUtils.strip(matcher.group("resource"), ":");

    ResourceType type = null;
    if (!ObjectUtils.isEmpty(resource)) {
      type = ResourceType.Resource;
    } else if (!ObjectUtils.isEmpty(api)) {
      type = ResourceType.Api;
    } else if (!ObjectUtils.isEmpty(service)) {
      type = ResourceType.Service;
    } else if (!ObjectUtils.isEmpty(namespace)) {
      type = ResourceType.Namespace;
    }
    return new AdspId(type, namespace, service, api, resource);
  }

  private final ResourceType type;
  private final String namespace;
  private final String service;
  private final String api;
  private final String resource;

  public ResourceType getType() {
    return type;
  }

  public String getNamespace() {
    return namespace;
  }

  public String getService() {
    return service;
  }

  public String getApi() {
    return api;
  }

  public String getResource() {
    return resource;
  }

  private AdspId(ResourceType type, String namespace, String service, String api, String resource) {
    this.type = type;
    this.namespace = namespace;
    this.service = service;
    this.api = api;
    this.resource = resource;
  }

  @Override
  public String toString() {
    return Stream.of("urn", "ads", namespace, service, api, resource)
        .filter((item) -> !StringUtils.isEmpty(item))
        .collect(Collectors.joining(":"));
  }

  @Override
  public boolean equals(Object other) {

    if (!(other instanceof AdspId)) {
      return false;
    }

    var otherId = (AdspId) other;

    return this.type.equals(otherId.type)
        && StringUtils.equals(this.namespace, otherId.namespace)
        && StringUtils.equals(this.service, otherId.service)
        && StringUtils.equals(this.api, otherId.api)
        && StringUtils.equals(this.resource, otherId.resource);
  }

  @Override
  public int hashCode() {
    return new HashCodeBuilder(3, 17)
        .append(this.type)
        .append(this.namespace)
        .append(this.service)
        .append(this.api)
        .append(this.resource)
        .toHashCode();
  }
}
