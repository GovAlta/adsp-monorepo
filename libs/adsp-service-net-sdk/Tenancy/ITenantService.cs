using Adsp.Sdk.Utils;

namespace Adsp.Sdk.Tenancy;
public interface ITenantService
{
  Task<Tenant?> GetTenant(AdspId tenantId);

  Task<IList<Tenant>> GetTenants();
}
