using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;

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
}
