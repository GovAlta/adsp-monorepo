package ca.ab.gov.alberta.adsp.sdk;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;
import ca.ab.gov.alberta.adsp.sdk.tenant.TenantService;

public final class AdspRequestContextHolder {
  public static final String USER_REQUEST_ATTRIBUTE = "adsp.user";
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

  public static AdspRequestContext current() {
    var attributes = RequestContextHolder.getRequestAttributes();
    if (attributes != null) {
      var userAttributeValue = attributes.getAttribute(USER_REQUEST_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
      var user = userAttributeValue instanceof User ? (User) userAttributeValue : null;

      AdspId tenantId = null;
      if (user != null && user.isCore()) {
        var tenantAttributeValue = attributes.getAttribute(TENANT_REQUEST_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        tenantId = tenantAttributeValue instanceof AdspId ? (AdspId) tenantAttributeValue : null;
      }

      return new AdspRequestContext(AdspRequestContextHolder.configuration, AdspRequestContextHolder.tenantService,
          AdspRequestContextHolder.configurationService, user, tenantId);
    } else {
      return null;
    }
  }
}
