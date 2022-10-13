package ca.ab.gov.alberta.adsp.sdk.metadata;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

@JsonInclude(value = Include.NON_NULL)
public class AdspMetadata {
  @JsonProperty("name")
  private final String name;
  @JsonProperty("description")
  private final String description;
  @JsonProperty("_links")
  private final Map<String, Link> links;

  public String getName() {
    return name;
  }

  public String getDescription() {
    return description;
  }

  public Map<String, Link> getLinks() {
    return links;
  }

  private AdspMetadata(Builder builder) {
    this.name = builder.name;
    this.description = builder.description;
    this.links = builder.links;
  }

  private AdspMetadata(AdspMetadata template, URI root) {
    this.name = template.name;
    this.description = template.description;

    this.links = new HashMap<String, Link>();
    for (var entry : template.getLinks().entrySet()) {
      var link = entry.getValue().toHref(root);
      this.links.put(entry.getKey(), link);
    }
    this.links.put("self", new Link(root));
  }

  AdspMetadata resolve(URI root) {
    return new AdspMetadata(this, root);
  }

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private String name;
    private String description;
    private final Map<String, Link> links = new HashMap<String, Link>();

    public String getName() {
      return name;
    }

    public String getDescription() {
      return description;
    }

    public Map<String, Link> getLinks() {
      return links;
    }

    public Builder withName(String name) {
      this.name = name;
      return this;
    }

    public Builder withDescription(String description) {
      this.description = description;
      return this;
    }

    public Builder withHealthPath(String path) {
      this.links.put("health", new Link(path));
      return this;
    }

    public Builder withDocsPath(String path) {
      this.links.put("docs", new Link(path));
      return this;
    }

    public Builder withApiPath(String path) {
      this.links.put("api", new Link(path));
      return this;
    }

    private Builder() {
    }

    public AdspMetadata build() {
      return new AdspMetadata(this);
    }
  }
}
