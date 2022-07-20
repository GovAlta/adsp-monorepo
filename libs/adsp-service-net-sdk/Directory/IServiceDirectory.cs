using Adsp.Sdk.Utils;

namespace Adsp.Sdk.Directory;
public interface IServiceDirectory
{
  Task<Uri> GetServiceUrl(AdspId serviceId);
}
