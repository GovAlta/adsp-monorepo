package ca.ab.gov.alberta.adsp.sdk.directory;

import java.net.URI;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

/**
 * Service directory for looking up URLs of services and APIs
 */
public interface ServiceDirectory {
  /**
   * Get the URL of a service or API
   *
   * @param serviceId AdspId of the service or API to lookup
   * @return Mono to subscribe to for the URL
   */
  Mono<URI> getServiceUrl(AdspId serviceId);
}
