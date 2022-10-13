package ca.ab.gov.alberta.adsp.sdk.metadata;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Hidden;
import reactor.core.publisher.Mono;

@Hidden
@RestController
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.REACTIVE)
@ConditionalOnBean(AdspMetadata.class)
@RequestMapping
class MetadataReactiveController {
  private final AdspMetadata metadata;

  public MetadataReactiveController(AdspMetadata metadata) {
    this.metadata = metadata;
  }

  @GetMapping
  public Mono<AdspMetadata> getMetadata(ServerHttpRequest serverHttpRequest) {
    return Mono.just(serverHttpRequest.getURI()).map(root -> this.metadata.resolve(root));
  }
}
