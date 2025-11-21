namespace Adsp.Sdk;

public class ServiceRegistration
{
  /// <summary>
  /// ADSP ID of the service and client ID for the associated service account.
  /// </summary>
  public AdspId? ServiceId { get; set; }
  /// <summary>
  /// Display name for the service.
  /// </summary>
  public string? DisplayName { get; set; }
  /// <summary>
  /// Description of the service.
  /// </summary>
  public string? Description { get; set; }
  /// <summary>
  /// Optional definition for the configuration used by the service. Set this property to specify the configuration schema
  /// expected by the service.
  /// </summary>
  public ConfigurationDefinition? Configuration { get; set; }
  /// <summary>
  /// Optional definition of roles used by the service. Set this property to describe service roles and allow administrators
  /// to add them as client roles from tenant administration.
  /// </summary>
  public IEnumerable<ServiceRole>? Roles { get; set; }
  /// <summary>
  /// Optional definitions of domain events sent by the service. Set this property to describe domain events and their the
  /// payload schemas.
  /// </summary>
  public IEnumerable<DomainEventDefinition>? Events { get; set; }
  /// <summary>
  /// Optional definitions of event streams used by the service.
  /// </summary>
  public IEnumerable<StreamDefinition>? EventStreams { get; set; }
  /// <summary>
  /// Optional definitions of file types used by the service. Set this property to describe file types and their read and
  /// update roles.
  /// </summary>
  public IEnumerable<FileType>? FileTypes { get; set; }
  /// <summary>
  /// Optional definitions of values used by the service.
  /// </summary>
  public IEnumerable<ValueDefinition>? Values { get; set; }
}
