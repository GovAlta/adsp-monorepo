package ca.ab.gov.alberta.adsp.sdk.metadata;

import java.net.URI;

import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonProperty;

class Link {
  private final String path;
  @JsonProperty("href")
  private final String href;

  public String getHref() {
    return href;
  }

  public Link(String path) {
    this.path = path;
    this.href = null;
  }

  Link(URI href) {
    this.path = null;
    this.href = href.toString();
  }

  Link toHref(URI root) {
    return new Link(UriComponentsBuilder.fromUri(root).path(this.path).build(""));
  }
}
