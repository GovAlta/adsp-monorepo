using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Adsp.Sdk.Access;

/// <summary>
/// Configures JwtBearerOptions for multi-tenant authentication with dynamic issuer validation.
/// This replaces the need for BuildServiceProvider during registration.
/// </summary>
internal sealed class TenantJwtBearerOptionsConfiguration : IConfigureNamedOptions<JwtBearerOptions>
{
  private readonly IIssuerCache _issuerCache;
  private readonly ITenantKeyProvider _keyProvider;
  private readonly AdspOptions _adspOptions;

  public TenantJwtBearerOptionsConfiguration(
    IIssuerCache issuerCache,
    ITenantKeyProvider keyProvider,
    IOptions<AdspOptions> adspOptions)
  {
    _issuerCache = issuerCache;
    _keyProvider = keyProvider;
    _adspOptions = adspOptions.Value;
  }

  public void Configure(string? name, JwtBearerOptions options)
  {
    // Only configure for tenant scheme when there's no specific realm (platform service scenario)
    if (!String.Equals(name, AdspAuthenticationSchemes.Tenant, StringComparison.Ordinal))
    {
      return;
    }

    // If realm is set, RealmJwtBearerOptionsConfiguration handles it
    if (!String.IsNullOrEmpty(_adspOptions.Realm))
    {
      return;
    }

    if (_adspOptions.ServiceId == null)
    {
      throw new InvalidOperationException("AdspOptions must include value for ServiceId.");
    }

    options.Audience = $"{_adspOptions.ServiceId}";
    options.TokenValidationParameters = new TokenValidationParameters
    {
      IssuerValidator = (issuer, token, parameters) =>
      {
        var tenant = _issuerCache.GetTenantByIssuer(issuer).Result;
        return tenant != null ? issuer : null;
      },
      IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
      {
        var keys = new List<SecurityKey>();
        var signingKey = _keyProvider.ResolveSigningKey(securityToken.Issuer, kid).Result;
        if (signingKey != null)
        {
          keys.Add(signingKey);
        }
        return keys;
      },
    };

    options.Events = new JwtBearerEvents
    {
      OnTokenValidated = async context =>
      {
        var tenant = await _issuerCache.GetTenantByIssuer(context.SecurityToken.Issuer);
        if (tenant?.Id != null)
        {
          context.AddAdspContext(_adspOptions.ServiceId, false, tenant);
        }
      }
    };
  }

  public void Configure(JwtBearerOptions options) => Configure(Options.DefaultName, options);
}
