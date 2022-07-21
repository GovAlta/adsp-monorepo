using System.Security.Claims;
using System.Text.Json;
using Adsp.Sdk.Tenancy;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Adsp.Sdk.Access;
internal static class AccessExtensions
{
  internal const string TenantContextKey = "ADSP:Tenant";

  private static TokenValidatedContext AddAdspContext(this TokenValidatedContext context, AdspId serviceId, Tenant? tenant)
  {
    var accessIdentity = new ClaimsIdentity();
    if (tenant?.Id != null)
    {
      accessIdentity.AddClaim(new Claim(AdspClaimTypes.Tenant, tenant.Id.ToString(), ClaimValueTypes.String));
    }
    else if (tenant == null)
    {
      accessIdentity.AddClaim(new Claim(AdspClaimTypes.Core, "true", ClaimValueTypes.Boolean));
    }

    var realmAccessClaim = context.Principal?.Claims.FirstOrDefault(claim => claim.Type == "realm_access");
    if (realmAccessClaim != null)
    {
      var access = JsonSerializer.Deserialize<AccessClaimRoles>(
        realmAccessClaim.Value,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
      );

      if (access?.Roles != null)
      {
        var claims = access.Roles.Select(role => new Claim(ClaimTypes.Role, role));
        accessIdentity.AddClaims(claims);
      }
    }

    var resourceAccessClaim = context.Principal?.Claims.FirstOrDefault(claim => claim.Type == "resource_access");
    if (resourceAccessClaim != null)
    {
      var clientsRoles = JsonSerializer.Deserialize<Dictionary<string, AccessClaimRoles>>(
        resourceAccessClaim.Value,
        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
      );

      if (clientsRoles != null)
      {
        var serviceClient = serviceId.ToString();
        foreach (var clientRoles in clientsRoles)
        {
          if (clientRoles.Value.Roles != null)
          {
            accessIdentity.AddClaims(
              clientRoles.Value.Roles.Select(role =>
              {
                // Exclude the prefix when for roles of the current service client.
                var prefix = String.Equals(clientRoles.Key, serviceClient, StringComparison.Ordinal) ? "" : $"{clientRoles.Key}:";
                return new Claim(ClaimTypes.Role, $"{prefix}{role}");
              })
            );
          }
        }
      }
    }

    context.Principal?.AddIdentity(accessIdentity);
    context.HttpContext.Items.Add(TenantContextKey, tenant);

    return context;
  }

  internal static AuthenticationBuilder AddRealmJwtAuthentication(
    this AuthenticationBuilder builder,
    string authenticationScheme,
    AdspOptions options,
    Tenant? tenant = null
  )
  {
    if (options.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    if (options.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    builder.AddJwtBearer(authenticationScheme, jwt =>
      {
        jwt.Authority = new Uri(
            options.AccessServiceUrl,
            $"/auth/realms/{options.Realm}"
          ).AbsoluteUri;
        jwt.Audience = $"{options.ServiceId}";
        jwt.Events = new JwtBearerEvents
        {
          OnTokenValidated = async (TokenValidatedContext context) =>
          {
            context.AddAdspContext(options.ServiceId, tenant);
          }
        };
      });

    return builder;
  }

  internal static AuthenticationBuilder AddTenantJwtAuthentication(
    this AuthenticationBuilder builder,
    string authenticationScheme,
    IIssuerCache issuerCache,
    ITenantKeyProvider keyProvider,
    AdspOptions options
  )
  {
    if (options.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    builder.AddJwtBearer(authenticationScheme, jwt =>
      {
        jwt.TokenValidationParameters = new TokenValidationParameters
        {
          IssuerValidator = (issuer, securityToken, validationParameters) =>
          {
            return issuer;
          },
          IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
          {
            var keys = new List<SecurityKey>();
            var signingKey = keyProvider.ResolveSigningKey(securityToken.Issuer, kid).Result;
            if (signingKey != null)
            {
              keys.Add(signingKey);
            }

            return keys;
          },
          TokenDecryptionKeyResolver = (string token, SecurityToken securityToken, string kid, TokenValidationParameters validationParameters) =>
          {
            return Enumerable.Empty<SecurityKey>();
          },
        };

        jwt.Audience = $"{options.ServiceId}";
        jwt.Events = new JwtBearerEvents
        {
          OnTokenValidated = async (TokenValidatedContext context) =>
          {
            var tenant = await issuerCache.GetTenantByIssuer(context.SecurityToken.Issuer);
            if (tenant?.Id != null)
            {
              context.AddAdspContext(options.ServiceId, tenant);
            }
          }
        };
      });

    return builder;
  }
}
