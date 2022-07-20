using System.Diagnostics.CodeAnalysis;

namespace Adsp.Sdk.Utils;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "For deserialization")]
internal class CollectionResults<T>
{
  public T[]? Results { get; set; }
}
