package ca.ab.gov.alberta.adsp.sdk.registration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.net.URI;
import java.net.URISyntaxException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.context.event.ContextRefreshedEvent;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;
import ca.ab.gov.alberta.adsp.sdk.AdspId;

@ExtendWith(MockitoExtension.class)
class RegistrationStartupListenerTests {

  @Test
  public void canRegisterOnStartup(@Mock ServiceRegistrar registrar) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").register(builder -> builder).build();
    var listener = new RegistrationStartupListener(configuration, registrar);

    listener.onEvent(new ContextRefreshedEvent(mock(ApplicationContext.class)));
    verify(registrar).register(serviceId, configuration.getRegistration());
  }

  @Test
  public void canRegisterOnceOnStartup(@Mock ServiceRegistrar registrar) throws URISyntaxException {

    var serviceId = AdspId.parse("urn:ads:platform:test-service");
    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        serviceId,
        "abc123").register(builder -> builder).build();
    var listener = new RegistrationStartupListener(configuration, registrar);

    listener.onEvent(new ContextRefreshedEvent(mock(ApplicationContext.class)));
    listener.onEvent(new ContextRefreshedEvent(mock(ApplicationContext.class)));
    verify(registrar, times(1)).register(serviceId, configuration.getRegistration());
  }

  @Test
  public void canHandleNoRegistration(@Mock ServiceRegistrar registrar) throws URISyntaxException {

    var configuration = AdspConfiguration.builder(
        new URI("https://access-service"),
        new URI("https://directory"),
        AdspId.parse("urn:ads:platform:test-service"),
        "abc123").build();
    var listener = new RegistrationStartupListener(configuration, registrar);

    listener.onEvent(new ContextRefreshedEvent(mock(ApplicationContext.class)));
    verify(registrar, times(0)).register(any(), any());
  }
}
