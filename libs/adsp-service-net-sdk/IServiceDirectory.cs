namespace Adsp.Sdk;
/// <summary>
/// Interface to the directory of services for looking up services and APIs.
/// </summary>
public interface IServiceDirectory
{
  /// <summary>
  /// Retrieves the URL for a specified service or API.
  /// </summary>
  /// <param name="serviceId">AdspId instance representing the service or API to lookup.</param>
  /// <returns>URL of the service or API.</returns>
  Task<Uri> GetServiceUrl(AdspId serviceId);
}
