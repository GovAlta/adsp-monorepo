using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Directory;
using Adsp.Sdk.Event;
using Adsp.Sdk.Registration;
using Adsp.Sdk.Tenancy;
using Microsoft.Extensions.DependencyInjection;

namespace Adsp.Sdk;
public static class AdspServiceCollectionExtensions
{
  private static IServiceCollection AddAdspSdkServices(this IServiceCollection services, AdspOptions options)
  {
    services.AddSingleton(options);
    services.AddSingleton<ITokenProvider, TokenProvider>();
    services.AddSingleton<IServiceDirectory, ServiceDirectory>();
    services.AddSingleton<ITenantService, TenantService>();
    services.AddSingleton<IIssuerCache, IssuerCache>();
    services.AddSingleton<ITenantKeyProvider, TenantKeyProvider>();
    services.AddSingleton<IConfigurationService, ConfigurationService>();
    services.AddSingleton<IEventService, EventService>();
    services.AddRegistration(options);

    return services;
  }

  public static IServiceCollection AddAdspForService(this IServiceCollection services, AdspOptions options)
  {
    if (services == null)
    {
      throw new ArgumentNullException(nameof(services));
    }

    if (options == null)
    {
      throw new ArgumentNullException(nameof(options));
    }

    services.AddAdspSdkServices(options);

    var providers = services.BuildServiceProvider();
    var tenantService = providers.GetRequiredService<ITenantService>();

    services
      .AddAuthentication(AdspAuthenticationSchemes.Tenant)
      .AddRealmJwtAuthentication(AdspAuthenticationSchemes.Tenant, tenantService, options);

    return services;
  }

  public static IServiceCollection AddAdspForPlatformService(this IServiceCollection services, AdspOptions options)
  {
    if (services == null)
    {
      throw new ArgumentNullException(nameof(services));
    }

    if (options == null)
    {
      throw new ArgumentNullException(nameof(options));
    }

    services.AddAdspSdkServices(options);

    var providers = services.BuildServiceProvider();
    var tenantService = providers.GetRequiredService<ITenantService>();
    var issuerCache = providers.GetRequiredService<IIssuerCache>();
    var keyProvider = providers.GetRequiredService<ITenantKeyProvider>();

    services
      .AddAuthentication()
      .AddRealmJwtAuthentication(AdspAuthenticationSchemes.Core, tenantService, options)
      .AddTenantJwtAuthentication(AdspAuthenticationSchemes.Tenant, issuerCache, keyProvider, options);

    return services;
  }
}
