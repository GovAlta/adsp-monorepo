using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Http;

namespace Adsp.Sdk;
public static class HttpContextExtensions
{
  public static User? GetAdspUser(this HttpContext context)
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    context.Items.TryGetValue(AccessExtensions.AdspContextKey, out object? user);

    return user as User;
  }

  public static Task<TC?> GetConfiguration<T, TC>(this HttpContext context, AdspId? tenantId = null) where T : class
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    var adspContext = context.GetAdspUser();

    var hasService = context.Items.TryGetValue(ConfigurationMiddleware.ConfigurationServiceContextKey, out object? service);
    if (!hasService || service == null)
    {
      throw new InvalidOperationException("Cannot get configuration from context without configuration middleware.");
    }

    var configurationService = (IConfigurationService)service;
    return configurationService.GetConfiguration<T, TC>(tenantId ?? adspContext?.Tenant?.Id);
  }

  public static Task<(T?, T?)> GetConfiguration<T>(this HttpContext context, AdspId? tenantId = null) where T : class
  {
    return context.GetConfiguration<T, (T?, T?)>(tenantId);
  }
}
