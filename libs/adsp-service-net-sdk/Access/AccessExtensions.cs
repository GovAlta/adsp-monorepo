using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Adsp.Sdk.Access;

internal static class AccessExtensions
{
  private static readonly JsonSerializerOptions JsonSerializerOptions = new() { PropertyNameCaseInsensitive = true };

  internal static TokenValidatedContext AddAdspContext(this TokenValidatedContext context, AdspId serviceId, bool isCore, Tenant? tenant)
  {
    var subClaim = context.Principal?.Claims.FirstOrDefault(claim => claim.Type == ClaimTypes.NameIdentifier);
    var usernameClaim = context.Principal?.Claims.FirstOrDefault(claim => claim.Type == "preferred_username");
    var emailClaim = context.Principal?.Claims.FirstOrDefault(claim => claim.Type == "email");

    // If there is no subject, then something isn't right about the token authentication.
    if (subClaim == null)
    {
      return context;
    }

    var accessIdentity = new ClaimsIdentity();
    if (tenant?.Id != null)
    {
      accessIdentity.AddClaim(new Claim(AdspClaimTypes.Tenant, tenant.Id.ToString(), ClaimValueTypes.String));
    }
    else if (isCore)
    {
      accessIdentity.AddClaim(new Claim(AdspClaimTypes.Core, "true", ClaimValueTypes.Boolean));
    }

    var realmAccessClaim = context.Principal!.Claims.FirstOrDefault(claim => claim.Type == "realm_access");
    if (realmAccessClaim != null)
    {
      var access = JsonSerializer.Deserialize<AccessClaimRoles>(
        realmAccessClaim.Value,
        JsonSerializerOptions
      );

      if (access?.Roles != null)
      {
        var claims = access.Roles.Select(role => new Claim(ClaimTypes.Role, role));
        accessIdentity.AddClaims(claims);
      }
    }

    var resourceAccessClaim = context.Principal!.Claims.FirstOrDefault(claim => claim.Type == "resource_access");
    if (resourceAccessClaim != null)
    {
      var clientsRoles = JsonSerializer.Deserialize<Dictionary<string, AccessClaimRoles>>(
        resourceAccessClaim.Value,
        JsonSerializerOptions
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

    context.Principal!.AddIdentity(accessIdentity);

    context.HttpContext.Items.Add(
      AccessConstants.AdspContextKey,
      new User(
        accessIdentity.HasClaim(AdspClaimTypes.Core, "true"),
        tenant,
        subClaim.Value,
        usernameClaim?.Value,
        emailClaim?.Value,
        context.Principal!
      )
    );

    return context;
  }

  internal static AuthenticationBuilder AddRealmJwtAuthentication(
    this AuthenticationBuilder builder,
    string authenticationScheme,
    ITenantService tenantService,
    AdspOptions options
  )
  {

    if (options.AccessServiceUrl == null)
    {
      throw new ArgumentException("Provided options must include value for AccessServiceUrl.", nameof(options));
    }

    if (options.ServiceId == null)
    {
      throw new ArgumentException("Provided options must include value for ServiceId.", nameof(options));
    }

    if (
      String.Equals(AdspAuthenticationSchemes.Tenant, authenticationScheme, StringComparison.Ordinal) &&
      String.IsNullOrEmpty(options.Realm)
    )
    {
      throw new ArgumentException("Provided options must include tenant realm for tenant authentication scheme.");
    }
    var isCore = String.Equals(AdspAuthenticationSchemes.Core, authenticationScheme, StringComparison.Ordinal);
    var realm = isCore ? AccessConstants.CoreRealm : options.Realm;


    builder.AddJwtBearer(
      authenticationScheme,
      jwt =>
      {
        jwt.Authority = new Uri(options.AccessServiceUrl, $"/auth/realms/{realm}").AbsoluteUri;
        jwt.Audience = $"{options.ServiceId}";
        jwt.Events = new JwtBearerEvents
        {
          OnTokenValidated = async (TokenValidatedContext context) =>
          {
            Tenant? tenant = null;
            if (String.Equals(AdspAuthenticationSchemes.Tenant, authenticationScheme, StringComparison.Ordinal))
            {
              tenant = await tenantService.GetTenantByRealm(options.Realm!);
              if (tenant == null)
              {
                throw new InvalidOperationException($"Failed to find tenant matching realm '{options.Realm}'.");
              }
            }
            context.AddAdspContext(options.ServiceId, isCore, tenant);
          }
        };
      }
    );

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
      throw new ArgumentException("Provided options must include value for ServiceId.", nameof(options));
    }

    builder.AddJwtBearer(authenticationScheme, jwt =>
    {
      jwt.TokenValidationParameters = new TokenValidationParameters
      {
        IssuerValidator = (issuer, token, parameters) =>
        {
          var tenant = issuerCache.GetTenantByIssuer(issuer).Result;
          return tenant != null ? issuer : null;
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
      };

      jwt.Audience = $"{options.ServiceId}";
      jwt.Events = new JwtBearerEvents
      {
        OnTokenValidated = async (TokenValidatedContext context) =>
        {
          var tenant = await issuerCache.GetTenantByIssuer(context.SecurityToken.Issuer);
          if (tenant?.Id != null)
          {
            context.AddAdspContext(options.ServiceId, false, tenant);
          }
        }
      };
    });

    return builder;
  }
}
