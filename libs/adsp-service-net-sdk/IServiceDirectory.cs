namespace Adsp.Sdk;
public interface IServiceDirectory
{
  Task<Uri> GetServiceUrl(AdspId serviceId);
}
