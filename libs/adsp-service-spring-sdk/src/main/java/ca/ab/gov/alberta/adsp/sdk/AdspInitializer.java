package ca.ab.gov.alberta.adsp.sdk;

import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;

@ConditionalOnWebApplication
@Configuration
@ComponentScan
@EnableCaching
@EnableScheduling
public class AdspInitializer {
  public AdspInitializer(AdspConfiguration configuration, ConfigurationService configurationService) {
    AdspRequestContextHolder.setConfiguration(configuration);
    AdspRequestContextHolder.setConfigurationService(configurationService);
  }
}
