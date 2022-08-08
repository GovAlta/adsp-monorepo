using System.Text.Json.Serialization;

namespace Adsp.Sdk;
public class User : UserIdentifier
{
  private readonly bool _isCore;
  private readonly Tenant? _tenant;

  private readonly string? _email;

  public Tenant? Tenant { get { return _tenant; } }

  public bool IsCore { get { return _isCore; } }
  public string? Email { get { return _email; } }

  internal User(bool isCore, Tenant? tenant, string id, string? name, string? email) : base(id, name)
  {
    _isCore = isCore;
    _tenant = tenant;
    _email = email;
  }
}
