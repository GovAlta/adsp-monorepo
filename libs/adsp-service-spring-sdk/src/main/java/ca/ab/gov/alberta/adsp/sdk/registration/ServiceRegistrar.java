package ca.ab.gov.alberta.adsp.sdk.registration;

import java.util.HashMap;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Scope;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.Assert;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.github.victools.jsonschema.generator.OptionPreset;
import com.github.victools.jsonschema.generator.SchemaGenerator;
import com.github.victools.jsonschema.generator.SchemaGeneratorConfigBuilder;
import com.github.victools.jsonschema.generator.SchemaVersion;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import ca.ab.gov.alberta.adsp.sdk.events.DomainEventDefinition;
import reactor.core.publisher.Mono;

@Component
@Scope("singleton")
class ServiceRegistrar {
  private final Logger logger = LoggerFactory.getLogger(ServiceRegistrar.class);

  private final SchemaGenerator generator;
  private final ServiceDirectory directory;
  private final TokenProvider tokenProvider;
  private final WebClient client;

  public ServiceRegistrar(ServiceDirectory directory, TokenProvider tokenProvider, WebClient.Builder clientBuilder) {

    this.directory = directory;
    this.tokenProvider = tokenProvider;
    this.client = clientBuilder.build();

    var configBuilder = new SchemaGeneratorConfigBuilder(SchemaVersion.DRAFT_2020_12, OptionPreset.PLAIN_JSON);
    var config = configBuilder.build();
    this.generator = new SchemaGenerator(config);
  }

  @SuppressWarnings("rawtypes")
  public void register(AdspId serviceId, ServiceRegistration registration) {
    Assert.notNull(serviceId, "serviceId cannot be null.");
    Assert.notNull(registration, "registration cannot be null.");

    this.logger.debug("Registering configuration for service {}...", serviceId);

    var configuration = registration.getConfiguration();
    if (configuration != null) {
      this.logger.debug("Registering configuration definition for service {}...", serviceId);

      var configurationSchema = this.generator.generateSchema(configuration.getSchemaClass());
      configuration.setConfigurationSchema(configurationSchema);

      var update = new HashMap<String, ConfigurationDefinition>();
      update.put(serviceId.getNamespace() + ":" + serviceId.getService(), configuration);
      this.updateServiceConfiguration(PlatformServices.ConfigurationServiceId, update)
          .blockOptional();
    }

    var roles = registration.getRoles();
    if (roles != null) {
      this.logger.debug("Registering roles for service {}...", serviceId);

      var update = new HashMap<String, ServiceRoles>();
      update.put(serviceId.toString(), new ServiceRoles(roles));
      this.updateServiceConfiguration(PlatformServices.TenantServiceId, update)
          .blockOptional();
    }

    var events = registration.getEvents();
    if (events != null) {
      this.logger.debug("Registering event definitions for service {}...", serviceId);

      var definitions = new HashMap<String, DomainEventDefinition>();
      events.forEach(event -> {
        var payloadSchema = this.generator.generateSchema(event.getPayloadClass());
        event.setPayloadSchema(payloadSchema);
        definitions.put(event.getName(), event);
      });

      var update = new HashMap<String, EventNamespace>();
      update.put(serviceId.getService(), new EventNamespace(serviceId.getService(), definitions));
      this.updateServiceConfiguration(PlatformServices.EventServiceId, update)
          .blockOptional();
    }

    var fileTypes = registration.getFileTypes();
    if (fileTypes != null) {
      this.logger.debug("Registering file types for service {}...", serviceId);

      var update = fileTypes.stream().collect(Collectors.toMap(type -> type.getId(), type -> type));
      this.updateServiceConfiguration(PlatformServices.FileServiceId, update)
          .blockOptional();
    }

    var streams = registration.getStreams();
    if (streams != null) {
      this.logger.debug("Registering streams for service {}...", serviceId);

      var update = streams.stream().collect(Collectors.toMap(stream -> stream.getId(), stream -> stream));
      this.updateServiceConfiguration(PlatformServices.PushServiceId, update)
          .blockOptional();
    }
  }

  private <T> Mono<Void> updateServiceConfiguration(AdspId serviceId, T configuration) {
    return Mono.zip(
        this.tokenProvider.getAccessToken(),
        this.directory.getServiceUrl(PlatformServices.ConfigurationServiceId))
        .flatMap(values -> this.client.patch()
            .uri(UriComponentsBuilder.fromUri(
                values.getT2()).path("/configuration/v2/configuration/{namespace}/{service}")
                .build(serviceId.getNamespace(), serviceId.getService()))
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + values.getT1())
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(new ConfigurationUpdate<T>(configuration))
            .retrieve()
            .bodyToMono(Void.class))
        .doOnSuccess(_v -> this.logger.info("Updated service registration configuration for {}.", serviceId))
        .doOnError(e -> this.logger.error("Error encountered updating configuration of {}", serviceId, e));
  }
}
