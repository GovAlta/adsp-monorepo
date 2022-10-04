package ca.ab.gov.alberta.adsp.sdk.directory;

import java.net.URI;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

public interface ServiceDirectory {
  Mono<URI> getServiceUrl(AdspId serviceId);
}
