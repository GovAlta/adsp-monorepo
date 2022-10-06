package ca.ab.gov.alberta.adsp.sdk;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AdspConfigurationSupport {

  @Value("${adsp.accessServiceUrl}")
  private String accessServiceUrl;
  @Value("${adsp.directoryUrl}")
  private String directoryUrl;
  @Value("${adsp.clientId}")
  private String serviceId;
  @Value("${adsp.clientSecret}")
  private String clientSecret;
  @Value("${adsp.tenantRealm}")
  private String realm;

  @Bean
  @ConditionalOnMissingBean
  public AdspConfiguration configure() {
    try {
      var builder = AdspConfiguration.builder(
          new URI(this.accessServiceUrl), new URI(this.directoryUrl), AdspId.parse(this.serviceId), this.clientSecret)
          .withRealm(this.realm);
      return this.customize(builder).build();
    } catch (Exception e) {
      throw new RuntimeException();
    }
  }

  protected AdspConfiguration.Builder customize(AdspConfiguration.Builder builder) {
    return builder;
  }
}
