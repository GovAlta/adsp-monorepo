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
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;

@Component
@Scope("singleton")
class AccessIssuerScheduledCache implements AccessIssuerCache {

  private final Logger logger = LoggerFactory.getLogger(ServiceAccountTokenProvider.class);

  private final String realm;
  private final URI accessServiceUrl;
  private final TenantService tenantService;
  private final Cache issuers;
  private final UriComponentsBuilder issuerUrlBuilder;

  public AccessIssuerScheduledCache(AdspConfiguration configuration, TenantService tenantService, CacheManager cacheManager) {
    this.realm = configuration.getRealm();
    this.accessServiceUrl = configuration.getAccessServiceUrl();
    this.tenantService = tenantService;
    this.issuers = cacheManager.getCache("adsp.issuers");
    this.issuerUrlBuilder = UriComponentsBuilder.fromUri(this.accessServiceUrl).path("/auth/realms/{realm}");

    if (configuration.isCoreUserAllowed()) {
      var issuer = issuerUrlBuilder.build(AccessConstants.CoreRealm);
      this.issuers.put(issuer.toString(), new AccessIssuer(true, null));

      this.logger.info("Including core issuer at {}", issuer);
    }
  }

  @Scheduled(timeUnit = TimeUnit.HOURS, fixedDelay = 5, initialDelay = 0)
  public void updateIssuers() {
    this.tenantService.getTenants()
        .doOnNext(tenants -> {
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

            var issuer = issuerUrlBuilder.build(tenant.getRealm());

            this.issuers.put(issuer.toString(), new AccessIssuer(false, tenant));
            logger.debug("Cached issuer {} -> {} ({})", issuer, tenant.getName(), tenant.getId());
          });
        })
        .blockOptional();
  }

  public AccessIssuer getCached(String issuer) {
    return this.issuers.get(issuer, AccessIssuer.class);
  }
}
