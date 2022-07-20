using System.Diagnostics.CodeAnalysis;

namespace Adsp.Sdk.Access;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal class AccessClaimRoles
{
  public string[]? Roles { get; set; }
}
