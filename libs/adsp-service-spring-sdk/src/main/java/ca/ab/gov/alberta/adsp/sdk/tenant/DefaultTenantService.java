package ca.ab.gov.alberta.adsp.sdk.tenant;

import java.util.Arrays;
import java.util.List;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import reactor.core.publisher.Mono;

@Service
@Scope("singleton")
class DefaultTenantService implements TenantService {

  private static final AdspId TENANT_SERVICE_API_ID = AdspId.parse("urn:ads:platform:tenant-service:v2");

  private final Logger logger = LoggerFactory.getLogger(DefaultTenantService.class);
  private final ServiceDirectory directory;
  private final TokenProvider tokenProvider;
  private final Cache tenantCache;
  private final WebClient client;

  public DefaultTenantService(CacheManager cacheManager, ServiceDirectory directory, TokenProvider tokenProvider,
      WebClient.Builder clientBuilder) {
    this.directory = directory;
    this.tokenProvider = tokenProvider;
    this.tenantCache = cacheManager.getCache("adsp.tenants");
    this.client = clientBuilder.build();
  }

  @Override
  public Mono<List<Tenant>> getTenants() {
    return Mono.zip(
        this.tokenProvider.getAccessToken(),
        this.directory.getServiceUrl(TENANT_SERVICE_API_ID))
        .flatMap((values) -> this.client.get()
            .uri(UriComponentsBuilder.fromUri(values.getT2()).path("/tenants").build(""))
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + values.getT1())
            .retrieve()
            .bodyToMono(TenantsResponse.class)
            .map((Function<TenantsResponse, List<Tenant>>) response -> Arrays.asList(response.getResults()))
            .doOnNext(tenants -> tenants.forEach(tenant -> this.tenantCache.put(tenant.getId(), tenant)))
            .doOnError(e -> this.logger.error("Error encountered on retrieving tenants.", e)));
  }

  @Override
  public Mono<Tenant> getTenant(AdspId tenantId) {
    return Mono.fromCallable(() -> this.tenantCache.get(tenantId, Tenant.class))
        .switchIfEmpty(this.getTenants()
            .map(tenants -> this.tenantCache.get(tenantId, Tenant.class)));
  }
}
