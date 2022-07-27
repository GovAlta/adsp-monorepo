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

  public static Task<TC?> GetConfiguration<T, TC>(this HttpContext context) where T : class
  {
    if (context == null)
    {
      throw new ArgumentNullException(nameof(context));
    }

    var adspContext = context.GetAdspUser();

    var hasService = context.Items.TryGetValue(ConfigurationMiddleware.ConfigurationServiceContextKey, out object? items);
    if (!hasService || items == null)
    {
      throw new InvalidOperationException("Cannot get configuration from context without configuration middleware.");
    }

    var (serviceId, configurationService) = ((AdspId, IConfigurationService))items;
    return configurationService.GetConfiguration<T, TC>(serviceId, adspContext?.Tenant?.Id);
  }

  public static Task<(T?, T?)> GetConfiguration<T>(this HttpContext context) where T : class
  {
    return context.GetConfiguration<T, (T?, T?)>();
  }
}
