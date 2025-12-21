using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Metrics;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Http;

namespace Adsp.Sdk;

public static class AdspHttpContextExtensions
{
  /// <summary>
  /// Retrieves ADSP user details from the request context.
  /// </summary>
  /// <param name="context">Context to get the user from.</param>
  /// <returns>Adsp user instance or null if no user in context (e.g. anonymous access).</returns>
  /// <exception cref="ArgumentNullException">Thrown if the context is null.</exception>
  public static User? GetAdspUser(this HttpContext context)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    context.Items.TryGetValue(AccessConstants.AdspContextKey, out object? user);

    return user as User;
  }

  /// <summary>
  /// Retrieves ADSP tenant details from the request context.
  /// The tenant is typically based on the user; for platform services access under a core context, the tenant may
  /// be specified by a tenantId query parameter.
  /// </summary>
  /// <param name="context">Context to get the tenant from.</param>
  /// <returns>ADSP tenant instance associated with the context.</returns>
  /// <exception cref="ArgumentNullException">Thrown if the context is null.</exception>
  /// <exception cref="InvalidOperationException">Thrown if TenantMiddleware not in request pipeline.</exception>
  public static async Task<Tenant?> GetTenant(this HttpContext context)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    using (context.Benchmark("get-tenant-time"))
    {
      var hasService = context.Items.TryGetValue(TenantMiddleware.TenantContextKey, out object? items);
      if (!hasService || items == null)
      {
        throw new InvalidOperationException("Cannot get tenant from context without tenant middleware.");
      }

      var (tenantId, tenantService) = ((AdspId, ITenantService))items;

      return await tenantService.GetTenant(tenantId);
    }
  }

  /// <summary>
  /// Retrieves configuration for the service in the request context. Configuration is retrieved for the current
  /// context tenant. Note that AdspOptions.CombineConfiguration is called to merge the configuration and result
  /// must be assignable to the specified combined configuration type.
  /// </summary>
  /// <typeparam name="T">Type of the configuration.</typeparam>
  /// <typeparam name="TC">Type of the combined configuration</typeparam>
  /// <param name="context">Context to get configuration under.</param>
  /// <returns>Tenant and core configuration combined.</returns>
  /// <exception cref="ArgumentNullException">Thrown if context is null.</exception>
  /// <exception cref="InvalidOperationException">
  ///   Thrown if ConfigurationMiddleware is not in the request pipeline.
  /// </exception>
  public static async Task<TC?> GetConfiguration<T, TC>(this HttpContext context) where T : class
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    using (context.Benchmark("get-configuration-time"))
    {
      var hasService = context.Items.TryGetValue(ConfigurationMiddleware.ConfigurationContextKey, out object? items);
      if (!hasService || items == null)
      {
        throw new InvalidOperationException("Cannot get configuration from context without configuration middleware.");
      }

      var tenant = await context.GetTenant();
      var (serviceId, configurationService) = ((AdspId, IConfigurationService))items;

      return await configurationService.GetConfiguration<T, TC>(serviceId, tenant?.Id);
    }
  }

  /// <summary>
  /// Retrieves configuration for the service in the request context. Configuration is retrieved for the current
  /// context tenant.
  /// </summary>
  /// <typeparam name="T">Type of the configuration.</typeparam>
  /// <param name="context">Context to get configuration under.</param>
  /// <returns>Tuple including tenant configuration and core configuration.</returns>
  public static Task<(T?, T?)> GetConfiguration<T>(this HttpContext context) where T : class
  {
    return context.GetConfiguration<T, (T?, T?)>();
  }
}
