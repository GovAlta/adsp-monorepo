using System.Net;

namespace Adsp.Sdk.Errors;

public class NotFoundException : HttpResponseException
{

  public NotFoundException() : base(HttpStatusCode.NotFound, "Requested resource not found.")
  {
  }
  public NotFoundException(string message) : base(HttpStatusCode.NotFound, message)
  {
  }

  public NotFoundException(string message, Exception innerException) : base(HttpStatusCode.NotFound, message, innerException)
  {
  }
}
