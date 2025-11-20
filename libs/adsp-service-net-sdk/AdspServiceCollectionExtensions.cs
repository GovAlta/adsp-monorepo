using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Directory;
using Adsp.Sdk.Events;
using Adsp.Sdk.Metrics;
using Adsp.Sdk.Registration;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk;

public static class AdspServiceCollectionExtensions
{
  private static IServiceCollection AddAdspSdkServices(this IServiceCollection services, Action<AdspOptions>? configureOptions = null)
  {
    if (configureOptions != null)
    {
      services.Configure(configureOptions);
    }

    services.AddMemoryCache();
    services.AddSingleton<ITokenProvider, TokenProvider>();
    services.AddSingleton<IServiceDirectory, ServiceDirectory>();
    services.AddSingleton<ITenantService, TenantService>();
    services.AddSingleton<IIssuerCache, IssuerCache>();
    services.AddSingleton<ITenantKeyProvider, TenantKeyProvider>();
    services.AddSingleton<IEventService, EventService>();
    services.AddSingleton<IMetricsValueService, MetricsValueService>();
    services.AddConfiguration();
    services.AddRegistration();

    return services;
  }

  /// <summary>
  /// Registers services needed to initialize ADSP platform service.
  /// </summary>
  /// <param name="services">Service collection.</param>
  /// <param name="configureOptions">Configure options action.</param>
  /// <param name="configureAuthentication">Configure authentication action.</param>
  /// <returns>Service collection.</returns>
  public static IServiceCollection AddAdspForService(
    this IServiceCollection services,
    Action<AdspOptions>? configureOptions = null,
    Action<AuthenticationBuilder>? configureAuthentication = null
  )
  {
    services.AddAdspSdkServices(configureOptions);

    var providers = services.BuildServiceProvider();
    var tenantService = providers.GetRequiredService<ITenantService>();
    var options = providers.GetRequiredService<IOptions<AdspOptions>>();

    var authenticationBuilder = services
      .AddAuthentication(AdspAuthenticationSchemes.Tenant)
      .AddRealmJwtAuthentication(AdspAuthenticationSchemes.Tenant, tenantService, options.Value);

    configureAuthentication?.Invoke(authenticationBuilder);

    return services;
  }

  /// <summary>
  /// Registers services needed to initialize ADSP tenant service.
  /// </summary>
  /// <param name="services">Service collection.</param>
  /// <param name="configureOptions">Configure options action.</param>
  /// <param name="configureAuthentication">Configure authentication action.</param>
  /// <returns>Service collection.</returns>
  public static IServiceCollection AddAdspForPlatformService(
    this IServiceCollection services,
    Action<AdspOptions>? configureOptions = null,
    Action<AuthenticationBuilder>? configureAuthentication = null
  )
  {
    services.AddAdspSdkServices(configureOptions);

    var providers = services.BuildServiceProvider();
    var tenantService = providers.GetRequiredService<ITenantService>();
    var issuerCache = providers.GetRequiredService<IIssuerCache>();
    var keyProvider = providers.GetRequiredService<ITenantKeyProvider>();
    var options = providers.GetRequiredService<IOptions<AdspOptions>>();

    var authenticationBuilder = services
      .AddAuthentication()
      .AddRealmJwtAuthentication(AdspAuthenticationSchemes.Core, tenantService, options.Value)
      .AddTenantJwtAuthentication(AdspAuthenticationSchemes.Tenant, issuerCache, keyProvider, options.Value);

    configureAuthentication?.Invoke(authenticationBuilder);

    return services;
  }
}
