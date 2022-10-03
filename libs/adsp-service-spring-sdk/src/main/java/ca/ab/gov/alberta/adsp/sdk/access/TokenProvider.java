package ca.ab.gov.alberta.adsp.sdk.access;

import reactor.core.publisher.Mono;

public interface TokenProvider {
  Mono<String> getAccessToken();
}
