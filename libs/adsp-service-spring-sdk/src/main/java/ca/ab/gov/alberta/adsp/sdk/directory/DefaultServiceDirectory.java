package ca.ab.gov.alberta.adsp.sdk.directory;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Scope;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;
import reactor.core.publisher.Mono;

@Component
@Scope("singleton")
class DefaultServiceDirectory implements ServiceDirectory {

  private static final ParameterizedTypeReference<List<EntryResponse>> ResponseTypeRef = new ParameterizedTypeReference<List<EntryResponse>>() {
  };

  private final Logger logger = LoggerFactory.getLogger(DefaultServiceDirectory.class);
  private final Cache directoryCache;
  private final WebClient client;

  public DefaultServiceDirectory(AdspConfiguration configuration, CacheManager cacheManager,
      WebClient.Builder clientBuilder) {
    this.directoryCache = cacheManager.getCache("adsp.directory");
    this.client = clientBuilder
        .baseUrl(UriComponentsBuilder.fromUri(configuration.getDirectoryUrl())
            .path("/directory/v2/namespaces/")
            .toUriString())
        .build();
  }

  @Override
  public Mono<URI> getServiceUrl(AdspId serviceId) {

    return Mono.fromCallable(() -> this.directoryCache.get(serviceId, URI.class))
        .switchIfEmpty(this.client.get()
            .uri("{namespace}/entries", serviceId.getNamespace())
            .retrieve()
            .bodyToMono(DefaultServiceDirectory.ResponseTypeRef)
            .map(entries -> {
              URI entry = null;
              if (entries != null) {
                entries.forEach(value -> {
                  try {
                    this.directoryCache.put(AdspId.parse(value.getUrn()), new URI(value.getUrl()));
                  } catch (URISyntaxException e1) {
                    logger.warn("Failed to parse entry {} with value: {}", value.getUrn(), value.getUrl());
                  }
                });
                entry = this.directoryCache.get(serviceId, URI.class);
              }
              return entry;
            }).doOnError(e -> {
              this.logger.error(
                  "Error encountered retrieving directory entries for {}.",
                  serviceId.getNamespace(),
                  e);
            })
            .onErrorComplete());
  }
}
