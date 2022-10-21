package ca.ab.gov.alberta.adsp.sdk.configuration;

import java.util.Optional;

import org.springframework.core.ParameterizedTypeReference;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

/**
 * Interface to a configuration service
 */
public interface ConfigurationService {

  /**
   * Get configuration
   *
   * @param <T>           Type of configuration object
   * @param serviceId     AdspId of the service to retrieve configuration for
   * @param tenantId      AdspId of the tenant to retrieve configuration for
   * @param typeReference Type reference for the configuration object type
   * @return Mono to subscribe to for the configuration
   */
  <T> Mono<T> getConfiguration(AdspId serviceId, Optional<AdspId> tenantId,
      ParameterizedTypeReference<T> typeReference);

  /**
   * Clear cached configuration
   *
   * @param serviceId AdspId of the service associated with the configuration
   * @param tenantId  AdspId of the tenant associated with the configuration
   */
  void clearCached(AdspId serviceId, Optional<AdspId> tenantId);
}
