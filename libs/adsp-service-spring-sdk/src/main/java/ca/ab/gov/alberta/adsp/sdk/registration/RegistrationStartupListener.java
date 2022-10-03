package ca.ab.gov.alberta.adsp.sdk.registration;

import org.springframework.context.annotation.Scope;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import ca.ab.gov.alberta.adsp.sdk.AdspConfiguration;

@Component
@Scope("singleton")
class RegistrationStartupListener {

  private final AdspConfiguration configuration;
  private final ServiceRegistrar registrar;
  private boolean registered = false;

  public RegistrationStartupListener(AdspConfiguration configuration, ServiceRegistrar registrar) {
    this.configuration = configuration;
    this.registrar = registrar;
  }

  @EventListener
  @Async
  public void onEvent(ContextRefreshedEvent event) {
    if (this.registered) {
      return;
    }

    var registration = configuration.getRegistration();
    if (registration != null) {
      this.registrar.register(this.configuration.getServiceId(), registration);
    }

    this.registered = true;
  }
}
