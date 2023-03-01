using System.Diagnostics.CodeAnalysis;

namespace Adsp.Sdk.Utils;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal sealed class CollectionResults<T>
{
  public IEnumerable<T>? Results { get; set; }
}
