using System.Net;

namespace Adsp.Sdk.Errors;

#pragma warning disable CA1032 // Implement standard exception constructors
public abstract class HttpResponseException : Exception
#pragma warning restore CA1032 // Implement standard exception constructors
{
  public HttpStatusCode Status { get; }

  protected HttpResponseException() : base()
  {
  }

  protected HttpResponseException(HttpStatusCode status, string message) : base(message)
  {
    Status = status;
  }

  protected HttpResponseException(HttpStatusCode status, string message, Exception innerException) : base(message, innerException)
  {
    Status = status;
  }
}
