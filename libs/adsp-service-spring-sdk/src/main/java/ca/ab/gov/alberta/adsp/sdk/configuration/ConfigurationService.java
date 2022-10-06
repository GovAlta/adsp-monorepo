package ca.ab.gov.alberta.adsp.sdk.configuration;

import java.util.Optional;

import org.springframework.core.ParameterizedTypeReference;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

public interface ConfigurationService {

  <T> Mono<T> getConfiguration(AdspId serviceId, Optional<AdspId> tenantId,
      ParameterizedTypeReference<T> typeReference);

  void clearCached(AdspId serviceId, Optional<AdspId> tenantIdl);
}
