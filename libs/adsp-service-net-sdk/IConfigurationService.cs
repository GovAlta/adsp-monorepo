namespace Adsp.Sdk;
/// <summary>
/// Interface to the configuration service.
/// </summary>
public interface IConfigurationService
{
  /// <summary>
  /// Retrieves configuration for a particular service and tenant.
  /// Note that AdspOptions.CombineConfiguration is called to merge the configuration and result
  /// must be assignable to the specified combined configuration type.
  /// </summary>
  /// <typeparam name="T">Type of the configuration.</typeparam>
  /// <typeparam name="TC">Type of the combined configuration</typeparam>
  /// <param name="serviceId">ADSP ID of the service to retrieve configuration for.</param>
  /// <param name="tenantId">ADSP ID of the tenant to retrieve configuration for.</param>
  /// <returns>Tenant and core configuration combined.</returns>
  Task<TC?> GetConfiguration<T, TC>(AdspId serviceId, AdspId? tenantId = null) where T : class;
  /// <summary>
  /// Retrieves configuration for a particular service and tenant.
  /// </summary>
  /// <typeparam name="T">Type of the configuration.</typeparam>
  /// <param name="serviceId">ADSP ID of the service to retrieve configuration for.</param>
  /// <param name="tenantId">ADSP ID of the tenant to retrieve configuration for.</param>
  /// <returns>Tuple including tenant configuration and core configuration.</returns>
  ///
  Task<(T?, T?)> GetConfiguration<T>(AdspId serviceId, AdspId? tenantId = null) where T : class;
  /// <summary>
  /// Clears the cached configuration for a particular service and tenant.
  /// </summary>
  /// <param name="serviceId">ADSP ID of the service.</param>
  /// <param name="tenantId">ADSP ID of the tenant.</param>
  void ClearCached(AdspId serviceId, AdspId? tenantId = null);
}
