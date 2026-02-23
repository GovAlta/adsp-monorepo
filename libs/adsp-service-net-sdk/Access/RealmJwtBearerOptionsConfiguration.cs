using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Access;

/// <summary>
/// Configures JwtBearerOptions for realm-based (single tenant or core) authentication.
/// This replaces the need for BuildServiceProvider during registration.
/// </summary>
internal sealed class RealmJwtBearerOptionsConfiguration : IConfigureNamedOptions<JwtBearerOptions>
{
  private readonly ITenantService _tenantService;
  private readonly AdspOptions _adspOptions;

  public RealmJwtBearerOptionsConfiguration(
    ITenantService tenantService,
    IOptions<AdspOptions> adspOptions)
  {
    _tenantService = tenantService;
    _adspOptions = adspOptions.Value;
  }

  public void Configure(string? name, JwtBearerOptions options)
  {
    var isCore = String.Equals(name, AdspAuthenticationSchemes.Core, StringComparison.Ordinal);
    var isTenant = String.Equals(name, AdspAuthenticationSchemes.Tenant, StringComparison.Ordinal);

    // Only configure for realm-based schemes when there's a specific realm configured
    // or it's the core scheme.
    if (!isCore && !isTenant)
    {
      return;
    }

    // For tenant scheme in platform services (no realm), skip - TenantJwtBearerOptionsConfiguration handles it.
    if (isTenant && String.IsNullOrEmpty(_adspOptions.Realm))
    {
      return;
    }

    if (_adspOptions.AccessServiceUrl == null)
    {
      throw new InvalidOperationException("AdspOptions must include value for AccessServiceUrl.");
    }

    if (_adspOptions.ServiceId == null)
    {
      throw new InvalidOperationException("AdspOptions must include value for ServiceId.");
    }

    var realm = isCore ? AccessConstants.CoreRealm : _adspOptions.Realm;

    options.Authority = new Uri(_adspOptions.AccessServiceUrl, $"/auth/realms/{realm}").AbsoluteUri;
    options.Audience = $"{_adspOptions.ServiceId}";
    options.Events = new JwtBearerEvents
    {
      OnTokenValidated = async context =>
      {
        Tenant? tenant = null;
        if (isTenant && !String.IsNullOrEmpty(_adspOptions.Realm))
        {
          tenant = await _tenantService.GetTenantByRealm(_adspOptions.Realm);
          if (tenant == null)
          {
            throw new InvalidOperationException($"Failed to find tenant matching realm '{_adspOptions.Realm}'.");
          }
        }
        context.AddAdspContext(_adspOptions.ServiceId, isCore, tenant);
      }
    };
  }

  public void Configure(JwtBearerOptions options) => Configure(Options.DefaultName, options);
}
