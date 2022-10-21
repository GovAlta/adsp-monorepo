package ca.ab.gov.alberta.adsp.sdk;

import java.util.function.Function;

import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;
import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

/**
 * Holder for statically accessing the ADSP context.
 */
public final class AdspRequestContextHolder {
  public static final String TENANT_REQUEST_ATTRIBUTE = "adsp.tenant";

  private static TenantService tenantService;
  private static AdspConfiguration configuration;
  private static ConfigurationService configurationService;

  static void setTenantService(TenantService tenantService) {
    AdspRequestContextHolder.tenantService = tenantService;
  }

  static void setConfiguration(AdspConfiguration configuration) {
    AdspRequestContextHolder.configuration = configuration;
  }

  static void setConfigurationService(ConfigurationService configurationService) {
    AdspRequestContextHolder.configurationService = configurationService;
  }

  private static AdspRequestContext getCurrentContext(SecurityContext context, Function<String, Object> getAttribute) {
    var principalValue = context.getAuthentication() != null ? context.getAuthentication().getPrincipal() : null;
    var user = principalValue instanceof User ? (User) principalValue : null;

    AdspId tenantId = null;
    if (user != null && user.isCore()) {
      var tenantAttributeValue = getAttribute.apply(TENANT_REQUEST_ATTRIBUTE);
      tenantId = tenantAttributeValue instanceof AdspId ? (AdspId) tenantAttributeValue : null;
    }

    return new AdspRequestContext(AdspRequestContextHolder.configuration, AdspRequestContextHolder.tenantService,
        AdspRequestContextHolder.configurationService, user, tenantId);
  }

  /**
   * <p>
   * Retrieves ADSP context using thread static contexts.
   * </p>
   *
   * <p>
   * Use this in servlet applications where each request is handled on a
   * particular worker thread.
   * </p>
   *
   * @return AdspRequestContext or null if context cannot be resolved
   */
  public static AdspRequestContext current() {
    var attributes = RequestContextHolder.getRequestAttributes();
    var securityContext = SecurityContextHolder.getContext();

    if (attributes != null) {
      return AdspRequestContextHolder
          .getCurrentContext(securityContext, attr -> attributes.getAttribute(attr, RequestAttributes.SCOPE_REQUEST));
    } else {
      return null;
    }
  }

  /**
   * <p>
   * Retrieves ADSP context using flux context view.
   * </p>
   *
   * <p>
   * Use this in reactive applications.
   * </p>
   *
   * @return Mono to subscribe to for AdspRequestContext
   */
  public static Mono<AdspRequestContext> getCurrent() {
    return Mono
        .zip(
            Mono.deferContextual(Mono::just).cast(ContextView.class),
            ReactiveSecurityContextHolder.getContext())
        .map(values -> AdspRequestContextHolder.getCurrentContext(
            values.getT2(),
            attr -> values.getT1().getOrDefault(attr, null)));
  }
}
