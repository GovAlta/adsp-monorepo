namespace Adsp.Sdk;

public class AdspOptions : ServiceRegistration
{
  /// <summary>
  /// URL to the access service used to retrieve service account access tokens and validate request tokens.
  /// </summary>
  public Uri? AccessServiceUrl { get; set; }
  /// <summary>
  /// URL to the directory service used to lookup services and APIs.
  /// </summary>
  public Uri? DirectoryUrl { get; set; }
  /// <summary>
  /// Client secret used to retrieve service access account tokens.
  /// </summary>
  public string? ClientSecret { get; set; }
  /// <summary>
  /// ID of the realm associated with the tenant of the service. This field is required for tenant services.
  /// </summary>
  public string? Realm { get; set; }
  /// <summary>
  /// Flag to enable configuration invalidation via websocket connection. The service account access token must include
  /// the urn:ads:platform:configuration-service:configured-service role and urn:ads:platform:push-service in the audience
  /// to connect to the stream.
  /// </summary>
  public bool? EnableConfigurationInvalidation { get; set; }
}
