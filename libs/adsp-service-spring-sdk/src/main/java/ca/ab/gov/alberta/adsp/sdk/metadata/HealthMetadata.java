package ca.ab.gov.alberta.adsp.sdk.metadata;

import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.stereotype.Component;

import java.util.Optional;

import org.springframework.boot.actuate.autoconfigure.endpoint.web.WebEndpointProperties;

@Component
@ConditionalOnClass(WebEndpointProperties.class)
public class HealthMetadata {
  private final String healthPath;

  public String getHealthPath() {
    return healthPath;
  }

  public HealthMetadata(Optional<WebEndpointProperties> properties) {
    this.healthPath = properties.isPresent() ? properties.get().getBasePath() + "/health" : null;
  }
}
