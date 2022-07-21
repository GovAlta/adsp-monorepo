using Adsp.Sdk.Access;
using Adsp.Sdk.Configuration;
using Adsp.Sdk.Directory;
using Adsp.Sdk.Registration;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Adsp.Sdk;
public static class ServiceCollectionExtensions
{
  private static IServiceCollection AddAdspSdkServices(this IServiceCollection services, AdspOptions options)
  {
    services.Add(ServiceDescriptor.Singleton<ITokenProvider>(
      (providers) => new TokenProvider(providers.GetRequiredService<ILogger<TokenProvider>>(), options)
    ));
    services.Add(ServiceDescriptor.Singleton<IServiceDirectory>(
      (providers) => new ServiceDirectory(providers.GetRequiredService<ILogger<ServiceDirectory>>(), options)
    ));
    services.Add(ServiceDescriptor.Singleton<ITenantService>(
      (providers) => new TenantService(
        providers.GetRequiredService<ILogger<TenantService>>(),
        providers.GetRequiredService<IServiceDirectory>(),
        providers.GetRequiredService<ITokenProvider>()
      )
    ));
    services.Add(ServiceDescriptor.Singleton<IIssuerCache>(
      (providers) => new IssuerCache(
        providers.GetRequiredService<ILogger<IssuerCache>>(),
        providers.GetRequiredService<ITenantService>(),
        options
      )
    ));
    services.Add(ServiceDescriptor.Singleton<ITenantKeyProvider>(
      (providers) => new TenantKeyProvider(
        providers.GetRequiredService<ILogger<TenantKeyProvider>>(),
        providers.GetRequiredService<IIssuerCache>(),
        options
      )
    ));
    services.Add(ServiceDescriptor.Singleton<IConfigurationService>(
      (providers) => new ConfigurationService(
        providers.GetRequiredService<ILogger<ConfigurationService>>(),
        providers.GetRequiredService<IServiceDirectory>(),
        providers.GetRequiredService<ITokenProvider>(),
        options
      )
    ));
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

    services
      .AddAdspSdkServices(options)
      .AddAuthentication()
      .AddRealmJwtAuthentication("tenant", options);

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
    var issuerCache = providers.GetRequiredService<IIssuerCache>();
    var keyProvider = providers.GetRequiredService<ITenantKeyProvider>();

    services
      .AddAuthentication()
      .AddRealmJwtAuthentication("core", options)
      .AddTenantJwtAuthentication("tenant", issuerCache, keyProvider, options);

    return services;
  }
}
