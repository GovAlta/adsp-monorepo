package ca.ab.gov.alberta.adsp.sdk.access;

import java.net.URI;
import java.time.Instant;
import java.util.function.BiConsumer;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import reactor.core.publisher.Mono;
import reactor.core.publisher.SynchronousSink;

@Component
@Scope("singleton")
class ServiceAccountTokenProvider implements TokenProvider {

  private final Logger logger = LoggerFactory.getLogger(ServiceAccountTokenProvider.class);

  private final Object tokenLock = new Object();
  private String token;
  private Instant expiresAt;

  private final URI authUrl;
  private final String clientId;
  private final String clientSecret;
  private final WebClient client;

  public ServiceAccountTokenProvider(AdspConfiguration configuration, WebClient.Builder clientBuilder) {
    this.authUrl = UriComponentsBuilder.fromUri(configuration.getAccessServiceUrl())
        .path("/auth/realms/{realm}/protocol/openid-connect/token")
        .build(StringUtils.isNotEmpty(configuration.getRealm()) ? configuration.getRealm() : "core");

    this.clientId = configuration.getServiceId().toString();
    this.clientSecret = configuration.getClientSecret();
    this.client = clientBuilder.build();
  }

  private ImmutablePair<String, Instant> getCachedToken() {
    synchronized (this.tokenLock) {
      return new ImmutablePair<>(this.token, this.expiresAt);
    }
  }

  private void setCachedToken(String token, Instant expiresAt) {
    synchronized (this.tokenLock) {
      this.token = token;
      this.expiresAt = expiresAt;
    }
  }

  @Override
  public Mono<String> getAccessToken() {
    ImmutablePair<String, Instant> cached = getCachedToken();
    if (cached.left != null && Instant.now().isBefore(cached.right)) {

      this.logger.debug("Retrieving access token from cache.");
      return Mono.just(cached.left);
    } else {
      this.logger.debug("Requesting access token from {}...", this.authUrl);

      var formValues = new LinkedMultiValueMap<String, String>();
      formValues.add("grant_type", "client_credentials");
      formValues.add("client_id", this.clientId);
      formValues.add("client_secret", this.clientSecret);

      return this.client.post()
          .uri(this.authUrl)
          .body(BodyInserters.fromFormData(formValues))
          .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
          .retrieve()
          .bodyToMono(TokenResponse.class)
          .handle((BiConsumer<TokenResponse, SynchronousSink<TokenResponse>>) (response, sink) -> {
            if (response != null && response.getAccessToken() != null) {
              sink.next(response);
            } else {
              sink.error(new RuntimeException("Cannot find access token in response."));
            }
          })
          .doOnNext(response -> {
            setCachedToken(response.getAccessToken(), Instant.now().plusSeconds(response.getExpiresIn()));
            this.logger.debug("Retrieved and cached access token.");
          })
          .map(response -> response.getAccessToken())
          .doOnError(e -> this.logger.error("Error encountered retrieving access token", e));
    }
  }
}
