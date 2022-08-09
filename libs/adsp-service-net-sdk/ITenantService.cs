namespace Adsp.Sdk;
/// <summary>
/// Interface to the tenant service for retrieving tenant information.
/// </summary>
public interface ITenantService
{
  /// <summary>
  /// Retrieves tenant by tenant ID.
  /// </summary>
  /// <param name="tenantId">ADSP ID of the tenant.</param>
  /// <returns>Tenant associated with the ID.</returns>
  Task<Tenant?> GetTenant(AdspId tenantId);
  /// <summary>
  /// Retrieves tenant by the associated realm.
  /// </summary>
  /// <param name="realm">Realm of the tenant.</param>
  /// <returns>Tenant associated with the realm.</returns>
  Task<Tenant?> GetTenantByRealm(string realm);
  /// <summary>
  /// Retrieves all tenants.
  /// </summary>
  /// <returns>Collection of tenants.</returns>
  Task<IEnumerable<Tenant>> GetTenants();
}
