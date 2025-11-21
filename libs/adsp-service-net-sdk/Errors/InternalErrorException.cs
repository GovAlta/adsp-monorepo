using System.Net;

namespace Adsp.Sdk.Errors;

public class InternalErrorException : HttpResponseException
{

  public InternalErrorException() : base(HttpStatusCode.InternalServerError, "Internal error.")
  {
  }
  public InternalErrorException(string message) : base(HttpStatusCode.InternalServerError, message)
  {
  }

  public InternalErrorException(string message, Exception innerException) : base(HttpStatusCode.InternalServerError, message, innerException)
  {
  }
}
