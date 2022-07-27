namespace Adsp.Sdk;
public interface IConfigurationService
{
  Task<TC?> GetConfiguration<T, TC>(AdspId serviceId, AdspId? tenantId = null) where T : class;
  Task<(T?, T?)> GetConfiguration<T>(AdspId serviceId, AdspId? tenantId = null) where T : class;

  void ClearCached(AdspId serviceId, AdspId? tenantId = null);
}
