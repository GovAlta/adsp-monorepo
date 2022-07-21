namespace Adsp.Sdk;
public class AdspContext
{
  private readonly bool _isCore;
  private readonly Tenant? _tenant;

  internal AdspContext(bool isCore, Tenant? tenant = null)
  {
    _isCore = isCore;
    _tenant = tenant;
  }

  public Tenant? Tenant { get { return _tenant; } }

  public bool IsCore { get { return _isCore; } }
}
