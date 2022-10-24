package ca.ab.gov.alberta.adsp.sdk.configuration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;

@ConditionalOnBean(AdspConfiguration.class)
@Configuration
class InvalidationConfiguration {
  private final AdspConfiguration configuration;
  private final ConfigurationService configurationService;

  InvalidationConfiguration(AdspConfiguration configuration, ConfigurationService configurationService) {
    this.configuration = configuration;
    this.configurationService = configurationService;
  }

  @Bean
  ConfigurationEventListener configurationEventListener() {
    return this.configuration.isConfigurationInvalidationEnabled()
        ? new ConfigurationEventListener(this.configurationService)
        : null;
  }
}
