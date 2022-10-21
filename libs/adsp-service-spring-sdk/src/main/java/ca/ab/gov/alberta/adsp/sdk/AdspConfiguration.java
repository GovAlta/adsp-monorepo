package ca.ab.gov.alberta.adsp.sdk;

import java.net.URI;
import java.util.function.Function;

import ca.ab.gov.alberta.adsp.sdk.registration.ServiceRegistration;

/**
 * Configuration of ADSP SDK
 */
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

  /**
   * Initialize a builder for AdspConfiguration.
   *
   * @param accessServiceUrl URL for access service
   * @param directoryUrl     URL for directory service
   * @param serviceId        AdspId representing the service used as the client ID
   * @param clientSecret     Client secret for the service
   * @return Builder
   */
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

    /**
     * Set the tenant realm associated with the service credentials; leave null for
     * platform services
     *
     * @param realm Name of the tenant realm
     * @return Builder
     */
    public Builder withRealm(String realm) {
      this.realm = realm;

      return this;
    }

    /**
     * Set the display name of the service
     *
     * @param displayName Display name of the service
     * @return Builder
     */
    public Builder withDisplayName(String displayName) {
      this.displayName = displayName;

      return this;
    }

    /**
     * Set the description of the service
     *
     * @param description Description of the service
     * @return
     */
    public Builder withDescription(String description) {
      this.description = description;

      return this;
    }

    /**
     * <p>
     * Set the ant patterns for service API(s)
     * </p>
     *
     * <p>
     * SDK auto-configures the security filter chain to secure paths matching the
     * specified ant patterns.
     * </p>
     *
     * @param patterns Ant patterns for service API(s)
     * @return Builder
     */
    public Builder withApiAntPattern(String... patterns) {
      this.apiAntPatterns = patterns;

      return this;
    }

    /**
     * <p>
     * Set a flag indicating if core users are allowed
     * </p>
     *
     * <p>
     * Core is a shared realm for cross-tenant access. Services that permit core
     * should apply role based authorization for core access.
     * </p>
     *
     * @param allowCoreUser Flag indicating if core users are allowed
     * @return Builder
     */
    public Builder allowsCoreUser(boolean allowCoreUser) {
      this.allowCoreUser = allowCoreUser;

      return this;
    }

    /**
     * Build service registration
     *
     * @param buildRegistration Delegate for building service registration
     * @return Builder
     */
    public Builder register(Function<ServiceRegistration.Builder, ServiceRegistration.Builder> buildRegistration) {
      this.registration = buildRegistration.apply(ServiceRegistration.builder()).build();
      return this;
    }

    /**
     * Build AdspConfiguration
     *
     * @return AdspConfiguration
     */
    public AdspConfiguration build() {
      return new AdspConfiguration(this);
    }
  }
}
