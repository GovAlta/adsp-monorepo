package ca.ab.gov.alberta.adsp.sdk;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import ca.ab.gov.alberta.adsp.sdk.configuration.ConfigurationService;

public final class AdspRequestContextHolder {
  public static final String USER_REQUEST_ATTRIBUTE = "adsp.user";

  private static AdspConfiguration configuration;
  private static ConfigurationService configurationService;

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

      return new AdspRequestContext(AdspRequestContextHolder.configuration,
          AdspRequestContextHolder.configurationService, user);
    } else {
      return null;
    }
  }
}
