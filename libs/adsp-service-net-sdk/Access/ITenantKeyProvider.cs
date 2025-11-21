using Microsoft.IdentityModel.Tokens;

namespace Adsp.Sdk.Access;

internal interface ITenantKeyProvider
{
  Task<SecurityKey?> ResolveSigningKey(string issuer, string kid);
}
