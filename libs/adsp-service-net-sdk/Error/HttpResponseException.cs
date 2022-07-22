using System.Diagnostics.CodeAnalysis;
using System.Net;

namespace Adsp.Sdk.Error;
[SuppressMessage("Usage", "CA1032: Implement standard exception constructors", Justification = "Abstract class")]
public abstract class HttpResponseException : Exception
{
  private readonly HttpStatusCode _status;
  public HttpStatusCode Status
  {
    get { return _status; }
  }

  protected HttpResponseException() : base()
  {
  }

  protected HttpResponseException(HttpStatusCode status, string message) : base(message)
  {
    _status = status;
  }

  protected HttpResponseException(HttpStatusCode status, string message, Exception innerException) : base(message, innerException)
  {
    _status = status;
  }
}
