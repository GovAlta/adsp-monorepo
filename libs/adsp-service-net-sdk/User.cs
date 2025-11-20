using System.Security.Principal;

namespace Adsp.Sdk;

public class User : UserIdentifier
{
  private readonly bool _isCore;
  private readonly Tenant? _tenant;

  private readonly string? _email;
  private readonly IPrincipal _principal;

  public Tenant? Tenant { get { return _tenant; } }

  public bool IsCore { get { return _isCore; } }
  public string? Email { get { return _email; } }

  public bool IsInRole(string role)
  {
    return _principal.IsInRole(role);
  }

  internal User(bool isCore, Tenant? tenant, string id, string? name, string? email, IPrincipal principal) :
    base(id, name)
  {
    _isCore = isCore;
    _tenant = tenant;
    _email = email;
    _principal = principal;
  }
}
