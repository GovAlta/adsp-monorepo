namespace Adsp.Sdk;
public interface ITenantService
{
  Task<Tenant?> GetTenant(AdspId tenantId);

  Task<Tenant?> GetTenantByRealm(string realm);

  Task<IEnumerable<Tenant>> GetTenants();
}
