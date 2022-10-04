package ca.ab.gov.alberta.adsp.sdk.configuration;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Scope;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import reactor.core.publisher.Mono;

@Component
@Scope("singleton")
class DefaultConfigurationService implements ConfigurationService {

  private final Logger logger = LoggerFactory.getLogger(DefaultConfigurationService.class);

  private final Cache configurationCache;
  private final TokenProvider tokenProvider;
  private final ServiceDirectory directory;
  private final WebClient client;

  public DefaultConfigurationService(CacheManager cacheManager, ServiceDirectory directory,
      TokenProvider tokenProvider) {
    this.configurationCache = cacheManager.getCache("adsp.configuration");
    this.directory = directory;
    this.tokenProvider = tokenProvider;
    this.client = WebClient.create();
  }

  @Override
  public <T> Mono<T> getConfiguration(AdspId serviceId, Optional<AdspId> tenantId,
      ParameterizedTypeReference<T> typeReference) {

    Assert.notNull(serviceId, "serviceId cannot be null.");
    Assert.notNull(tenantId, "tenantId cannot be null.");
    Assert.notNull(typeReference, "typeReference cannot be null.");

    @SuppressWarnings("unchecked")
    Mono<T> configuration = tenantId.isPresent()
        ? Mono.fromCallable(() -> this.configurationCache.get(this.getCacheKey(serviceId, tenantId)))
            .map(cached -> (T) cached.get())
            .doOnNext(cached -> this.logger.debug("Cache hit for configuration of service {} for tenant {}.",
                serviceId.getService(), tenantId))
            .switchIfEmpty(
                this.retrieveConfiguration(serviceId, tenantId, typeReference))
        : Mono.empty();

    return configuration;
  }

  private <T extends Object> Mono<T> retrieveConfiguration(AdspId serviceId, Optional<AdspId> tenantId,
      ParameterizedTypeReference<T> typeReference) {
    return Mono.zip(
        this.tokenProvider.getAccessToken(),
        this.directory.getServiceUrl(PlatformServices.ConfigurationServiceId)).flatMap(
            values -> {
              return this.client.get()
                  .uri(UriComponentsBuilder.fromUri(values.getT2())
                      .path("/configuration/v2/configuration/{namespace}/{name}/latest")
                      .queryParam("tenantId", tenantId.isPresent() ? tenantId.get().toString() : null)
                      .build(serviceId.getNamespace(), serviceId.getService()))
                  .header(HttpHeaders.AUTHORIZATION, "Bearer " + values.getT1())
                  .retrieve()
                  .bodyToMono(typeReference)
                  .log();
            })
        .doOnNext(result -> this.configurationCache.put(this.getCacheKey(serviceId, tenantId), result))
        .doOnError(e -> this.logger.error("Error encountered requesting configuration of {} for tenant {}.",
            serviceId.getService(), tenantId, e));
  }

  @Override
  public void clearCached(AdspId serviceId, Optional<AdspId> tenantId) {
    Assert.notNull(serviceId, "serviceId cannot be null.");
    Assert.notNull(tenantId, "tenantId cannot be null.");

    this.configurationCache.evict(this.getCacheKey(serviceId, tenantId));
  }

  @Scheduled(timeUnit = TimeUnit.HOURS, fixedRate = 1)
  public void clearCached() {
    this.configurationCache.clear();
  }

  private String getCacheKey(AdspId serviceId, Optional<AdspId> tenantId) {
    return serviceId + "" + (tenantId.isPresent() ? tenantId.get() : "");
  }
}
