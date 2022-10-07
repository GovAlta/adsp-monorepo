package ca.ab.gov.alberta.adsp.sdk;

import java.util.Optional;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.util.Assert;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import reactor.core.publisher.Mono;

public final class AdspRequestContext {
  private final AdspId serviceId;
  private final ConfigurationService configurationService;
  private final User user;

  public User getUser() {
    return user;
  }

  AdspRequestContext(AdspConfiguration configuration, ConfigurationService configurationService, User user) {
    this.serviceId = configuration.getServiceId();
    this.configurationService = configurationService;
    this.user = user;
  }

  public <T> Mono<T> getConfiguration(ParameterizedTypeReference<T> typeReference) {
    Assert.notNull(typeReference, "typeReference cannot be null.");

    return this.configurationService.getConfiguration(this.serviceId,
        user.getTenant() != null ? Optional.of(user.getTenant().getId()) : Optional.empty(), typeReference);
  }
}
