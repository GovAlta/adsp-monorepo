using Adsp.Sdk.Tenancy;

namespace Adsp.Sdk.Access;
internal interface IIssuerCache
{
  Task<Tenant?> GetTenantByIssuer(string issuer);
}
