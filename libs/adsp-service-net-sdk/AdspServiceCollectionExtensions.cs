using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Directory;
using Adsp.Sdk.Events;
using Adsp.Sdk.Metrics;
using Adsp.Sdk.Registration;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
  /// Registers services needed to initialize ADSP tenant service.
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

    // Register options configuration - services are resolved lazily when JwtBearerOptions are needed
    services.AddSingleton<IConfigureOptions<JwtBearerOptions>, RealmJwtBearerOptionsConfiguration>();

    var authenticationBuilder = services
      .AddAuthentication(AdspAuthenticationSchemes.Tenant)
      .AddJwtBearer(AdspAuthenticationSchemes.Tenant);

    configureAuthentication?.Invoke(authenticationBuilder);

    return services;
  }

  /// <summary>
  /// Registers services needed to initialize ADSP platform service.
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

    // Register options configurations - services are resolved lazily when JwtBearerOptions are needed
    services.AddSingleton<IConfigureOptions<JwtBearerOptions>, RealmJwtBearerOptionsConfiguration>();
    services.AddSingleton<IConfigureOptions<JwtBearerOptions>, TenantJwtBearerOptionsConfiguration>();

    var authenticationBuilder = services
      .AddAuthentication()
      .AddJwtBearer(AdspAuthenticationSchemes.Core)
      .AddJwtBearer(AdspAuthenticationSchemes.Tenant);

    configureAuthentication?.Invoke(authenticationBuilder);

    return services;
  }
}
