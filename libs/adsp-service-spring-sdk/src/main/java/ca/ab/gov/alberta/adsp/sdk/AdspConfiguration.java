package ca.ab.gov.alberta.adsp.sdk;

import java.net.URI;
import java.util.function.Function;

import ca.ab.gov.alberta.adsp.sdk.registration.ServiceRegistration;

public class AdspConfiguration {

  private final URI accessServiceUrl;
  private final String realm;
  private final URI directoryUrl;
  private final AdspId serviceId;
  private final String clientSecret;
  private final String displayName;
  private final String description;
  private final String[] apiAntPatterns;
  private final boolean allowCoreUser;

  private final ServiceRegistration registration;

  public static Builder builder(URI accessServiceUrl, URI directoryUrl, AdspId serviceId, String clientSecret) {
    return new Builder(accessServiceUrl, directoryUrl, serviceId, clientSecret);
  }

  public URI getAccessServiceUrl() {
    return accessServiceUrl;
  }

  public String getRealm() {
    return realm;
  }

  public URI getDirectoryUrl() {
    return directoryUrl;
  }

  public AdspId getServiceId() {
    return serviceId;
  }

  public String getClientSecret() {
    return clientSecret;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getDescription() {
    return description;
  }

  public String[] getApiAntPatterns() {
    return apiAntPatterns;
  }

  public boolean getAllowCoreUser() {
    return allowCoreUser;
  }

  public ServiceRegistration getRegistration() {
    return registration;
  }

  private AdspConfiguration(Builder builder) {
    this.accessServiceUrl = builder.getAccessServiceUrl();
    this.realm = builder.getRealm();
    this.directoryUrl = builder.getDirectoryUrl();
    this.serviceId = builder.getServiceId();
    this.clientSecret = builder.getClientSecret();

    this.displayName = builder.getDisplayName();
    this.description = builder.getDescription();
    this.apiAntPatterns = builder.getApiAntPatterns();
    this.allowCoreUser = builder.getAllowCoreUser();

    this.registration = builder.getRegistration();
  }

  public static final class Builder {

    private final URI accessServiceUrl;
    private final URI directoryUrl;

    private final AdspId serviceId;
    private final String clientSecret;

    private String realm;
    private String displayName;
    private String description;

    private String[] apiAntPatterns = { "/*/v?/**" };
    private boolean allowCoreUser;

    private ServiceRegistration registration;

    public URI getAccessServiceUrl() {
      return accessServiceUrl;
    }

    public URI getDirectoryUrl() {
      return directoryUrl;
    }

    public AdspId getServiceId() {
      return serviceId;
    }

    public String getClientSecret() {
      return clientSecret;
    }

    public String getRealm() {
      return realm;
    }

    public String getDisplayName() {
      return displayName;
    }

    public String getDescription() {
      return description;
    }

    public String[] getApiAntPatterns() {
      return apiAntPatterns;
    }

    public boolean getAllowCoreUser() {
      return allowCoreUser;
    }

    public ServiceRegistration getRegistration() {
      return registration;
    }

    private Builder(URI accessServiceUrl, URI directoryUrl, AdspId serviceId, String clientSecret) {
      this.accessServiceUrl = accessServiceUrl;
      this.directoryUrl = directoryUrl;
      this.serviceId = serviceId;
      this.clientSecret = clientSecret;
    }

    public Builder withRealm(String realm) {
      this.realm = realm;

      return this;
    }

    public Builder withDisplayName(String displayName) {
      this.displayName = displayName;

      return this;
    }

    public Builder withDescription(String description) {
      this.description = description;

      return this;
    }

    public Builder withApiAntPattern(String... patterns) {
      this.apiAntPatterns = patterns;

      return this;
    }

    public Builder allowsCoreUser(boolean allowCoreUser) {
      this.allowCoreUser = allowCoreUser;

      return this;
    }

    public Builder register(Function<ServiceRegistration.Builder, ServiceRegistration.Builder> buildRegistration) {
      this.registration = buildRegistration.apply(ServiceRegistration.builder()).build();
      return this;
    }

    public AdspConfiguration build() {
      return new AdspConfiguration(this);
    }
  }
}
