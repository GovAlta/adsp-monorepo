package ca.ab.gov.alberta.adsp.sdk.metadata;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;

/**
 * <p>
 * Configuration support for ADSP metadata
 * </p>
 *
 * <p>
 * Extend and override customize or configure to change configuration.
 * </p>
 */
@Configuration
@ConditionalOnBean(AdspConfiguration.class)
public class AdspMetadataSupport {
  @Autowired
  private AdspConfiguration configuration;

  @Autowired(required = false)
  private ApiDocsMetadata docsMetadata;

  @Autowired(required = false)
  private HealthMetadata healthMetadata;

  public AdspMetadataSupport() {
  }

  @Bean("adsp.configureMetadata")
  @ConditionalOnMissingBean
  public AdspMetadata configure() {
    var builder = AdspMetadata.builder()
        .withName(this.configuration.getDisplayName())
        .withDescription(this.configuration.getDescription());

    if (this.docsMetadata != null) {
      builder.withDocsPath(this.docsMetadata.getOpenApiPath());
    }

    if (this.healthMetadata != null) {
      builder.withHealthPath(this.healthMetadata.getHealthPath());
    }

    return this.customize(builder).build();
  }

  protected AdspMetadata.Builder customize(AdspMetadata.Builder builder) {
    return builder;
  }
}
