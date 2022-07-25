namespace Adsp.Sdk;
public interface ITenantService
{
  Task<Tenant?> GetTenant(AdspId tenantId);

  Task<IList<Tenant>> GetTenants();
}
