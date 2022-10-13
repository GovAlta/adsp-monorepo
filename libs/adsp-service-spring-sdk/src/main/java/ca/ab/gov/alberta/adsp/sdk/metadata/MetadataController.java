package ca.ab.gov.alberta.adsp.sdk.metadata;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import io.swagger.v3.oas.annotations.Hidden;

@Hidden
@RestController
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnBean(AdspMetadata.class)
@RequestMapping
class MetadataController {
  private final AdspMetadata metadata;

  public MetadataController(AdspMetadata metadata) {
    this.metadata = metadata;
  }

  @GetMapping
  public AdspMetadata getMetadata() {
    var root = ServletUriComponentsBuilder.fromCurrentRequestUri().build("");

    var resolved = this.metadata.resolve(root);
    return resolved;
  }
}
