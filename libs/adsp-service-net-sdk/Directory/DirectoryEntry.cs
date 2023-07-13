using System.Diagnostics.CodeAnalysis;

namespace Adsp.Sdk.Directory;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class DirectoryEntry
{
  public Uri? Urn { get; set; }
  public Uri? Url { get; set; }
}
