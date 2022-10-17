package ca.ab.gov.alberta.adsp.sdk;

import java.util.Optional;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.util.Assert;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;
import reactor.core.publisher.Mono;

public final class AdspRequestContext {
  private final AdspId serviceId;
  private final ConfigurationService configurationService;
  private final TenantService tenantService;
  private final User user;
  private final AdspId tenantId;

  AdspRequestContext(AdspConfiguration configuration, TenantService tenantService,
      ConfigurationService configurationService, User user, AdspId tenantId) {
    this.serviceId = configuration.getServiceId();
    this.configurationService = configurationService;
    this.tenantService = tenantService;
    this.user = user;
    this.tenantId = tenantId;
  }

  public User getUser() {
    return user;
  }

  public Mono<Tenant> getTenant() {
    Mono<Tenant> tenant = Mono.empty();

    var user = this.getUser();
    if (user != null) {
      tenant = user.isCore() && this.tenantId != null ? this.tenantService.getTenant(this.tenantId)
          : Mono.just(user.getTenant());
    }

    return tenant;
  }

  public <T> Mono<T> getConfiguration(ParameterizedTypeReference<T> typeReference) {
    Assert.notNull(typeReference, "typeReference cannot be null.");

    return this.getTenant()
        .flatMap(tenant -> this.configurationService.getConfiguration(this.serviceId, Optional.of(tenant.getId()),
            typeReference));
  }
}
