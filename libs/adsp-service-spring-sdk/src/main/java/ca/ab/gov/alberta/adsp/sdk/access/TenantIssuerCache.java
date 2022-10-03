package ca.ab.gov.alberta.adsp.sdk.access;

import java.net.URI;
import java.util.concurrent.TimeUnit;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Scope;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.tenant.Tenant;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;

@Component
@Scope("singleton")
class TenantIssuerCache {

  private final Logger logger = LoggerFactory.getLogger(ServiceAccountTokenProvider.class);

  private final String realm;
  private final URI accessServiceUrl;
  private final TenantService tenantService;
  private final Cache issuers;

  public TenantIssuerCache(AdspConfiguration configuration, TenantService tenantService, CacheManager cacheManager) {
    this.realm = configuration.getRealm();
    this.accessServiceUrl = configuration.getAccessServiceUrl();
    this.tenantService = tenantService;
    this.issuers = cacheManager.getCache("adsp.issuers");
  }

  @Scheduled(timeUnit = TimeUnit.HOURS, fixedDelay = 5, initialDelay = 0)
  public void updateIssuers() {
    this.tenantService.getTenants()
        .doOnNext(tenants -> {
          // TODO: Include configuration to verify tokens from core issuer.

          // NOTE: This is currently additive. Tenant removal would need to be handled
          // here as well as in all dependent components.
          tenants.forEach(tenant -> {
            if (StringUtils.isNotEmpty(this.realm) && !this.realm.equals(tenant.getRealm())) {
              // Realm context services only have access to their own tenant, but best to be
              // safe and not include extraneous providers.
              this.logger.warn("Unexpected tenant {} ({}) with realm {} not matching configured realm {}.",
                  tenant.getName(), tenant.getId(), tenant.getRealm(), this.realm);
              return;
            }

            var issuer = UriComponentsBuilder.fromUri(this.accessServiceUrl).path("/auth/realms/{realm}")
                .build(tenant.getRealm());

            this.issuers.put(issuer.toString(), tenant);
            logger.debug("Cached issuer {} -> {} ({})", issuer, tenant.getName(), tenant.getId());
          });
        })
        .block();
  }

  public Tenant getCached(String issuer) {
    return this.issuers.get(issuer, Tenant.class);
  }
}
