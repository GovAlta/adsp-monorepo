using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Http;

namespace Adsp.Sdk;
public static class AdspHttpContextExtensions
{
  public static User? GetAdspUser(this HttpContext context)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    context.Items.TryGetValue(AccessConstants.AdspContextKey, out object? user);

    return user as User;
  }

  public static async Task<Tenant?> GetTenant(this HttpContext context)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    var hasService = context.Items.TryGetValue(TenantMiddleware.TenantContextKey, out object? items);
    if (!hasService || items == null)
    {
      throw new InvalidOperationException("Cannot get tenant from context without tenant middleware.");
    }

    var (tenantId, tenantService) = ((AdspId, ITenantService))items;

    return await tenantService.GetTenant(tenantId);
  }

  public static async Task<TC?> GetConfiguration<T, TC>(this HttpContext context) where T : class
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    var hasService = context.Items.TryGetValue(ConfigurationMiddleware.ConfigurationContextKey, out object? items);
    if (!hasService || items == null)
    {
      throw new InvalidOperationException("Cannot get configuration from context without configuration middleware.");
    }

    var tenant = await context.GetTenant();
    var (serviceId, configurationService) = ((AdspId, IConfigurationService))items;

    return await configurationService.GetConfiguration<T, TC>(serviceId, tenant?.Id);
  }

  public static Task<(T?, T?)> GetConfiguration<T>(this HttpContext context) where T : class
  {
    return context.GetConfiguration<T, (T?, T?)>();
  }
}
