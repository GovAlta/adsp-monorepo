package ca.ab.gov.alberta.adsp.sdk;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.FilterType;
import org.springframework.scheduling.annotation.EnableScheduling;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.metadata.AdspMetadataSupport;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;

@ConditionalOnWebApplication
@Configuration
@ComponentScan(excludeFilters = {
    @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, value = AdspMetadataSupport.class) })
@EnableCaching
@EnableScheduling
public class AdspInitializer {
  public AdspInitializer(AdspConfiguration configuration, TenantService tenantService,
      ConfigurationService configurationService) {
    AdspRequestContextHolder.setConfiguration(configuration);
    AdspRequestContextHolder.setTenantService(tenantService);
    AdspRequestContextHolder.setConfigurationService(configurationService);
  }
}
