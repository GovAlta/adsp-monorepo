using System.Net;

namespace Adsp.Sdk.Error;
public class RequestArgumentException : HttpResponseException
{

  public RequestArgumentException() : base(HttpStatusCode.BadRequest, "Invalid request.")
  {
  }
  public RequestArgumentException(string message) : base(HttpStatusCode.BadRequest, message)
  {
  }

  public RequestArgumentException(string message, Exception innerException) : base(HttpStatusCode.BadRequest, message, innerException)
  {
  }
}
