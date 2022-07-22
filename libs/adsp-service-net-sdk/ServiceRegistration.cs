namespace Adsp.Sdk;
public class ServiceRegistration
{
  public AdspId? ServiceId { get; set; }
  public string? DisplayName { get; set; }
  public string? Description { get; set; }
  public IEnumerable<ServiceRole>? Roles { get; set; }
}
