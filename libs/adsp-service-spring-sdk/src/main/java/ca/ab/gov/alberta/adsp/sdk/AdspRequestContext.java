package ca.ab.gov.alberta.adsp.sdk;

import java.util.Optional;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.util.Assert;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;
import reactor.core.publisher.Mono;

/**
 * ADSP capabilities for the current request context.
 */
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

  /**
   * Get the user for the context.
   *
   * @return User if request is authenticated; otherwise null.
   */
  public User getUser() {
    return user;
  }

  /**
   * <p>
   * Get the tenant for the context.
   * </p>
   *
   * <p>
   * The tenant associated with the request is typically the tenant of the
   * requesting user (principal). However, for a platform service (realm is not
   * set), the SDK allows core users to specify the tenant via a query parameter,
   * </p>
   *
   * @return Mono to subscribe to for the tenant
   */
  public Mono<Tenant> getTenant() {
    Mono<Tenant> tenant = Mono.empty();

    var user = this.getUser();
    if (user != null) {
      tenant = user.isCore() && this.tenantId != null ? this.tenantService.getTenant(this.tenantId)
          : Mono.just(user.getTenant());
    }

    return tenant;
  }

  /**
   * <p>
   * Get service configuration in the context.
   * </p>
   *
   * <p>
   * Service configuration is retrieved for the context tenant. Use
   * ConfigurationService directly for more specific control.
   * </p>
   *
   * @param <T>           Type of the configuration object
   * @param typeReference Type reference for the configuration object
   * @return Mono to subscribe to for the configuration object
   */
  public <T> Mono<T> getConfiguration(ParameterizedTypeReference<T> typeReference) {
    Assert.notNull(typeReference, "typeReference cannot be null.");

    return this.getTenant()
        .flatMap(tenant -> this.configurationService.getConfiguration(this.serviceId, Optional.of(tenant.getId()),
            typeReference));
  }
}
