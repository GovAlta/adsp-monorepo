namespace Adsp.Sdk;
public interface IConfigurationService
{
  Task<TC?> GetConfiguration<T, TC>(AdspId? tenantId = null) where T : class;
  Task<(T?, T?)> GetConfiguration<T>(AdspId? tenantId = null) where T : class;
}
