using System.Net;
using Adsp.Sdk.Errors;

namespace Adsp.Platform.ScriptService.Services;

internal sealed class ScriptRunException : HttpResponseException
{
  public ScriptRunException() : base()
  {
  }

  public ScriptRunException(string message) :
    base(HttpStatusCode.InternalServerError, $"Error encountered during script execution: {message}")
  {
  }

  public ScriptRunException(string message, Exception innerException) :
    base(HttpStatusCode.InternalServerError, $"Error encountered during script execution: {message}", innerException)
  {
  }
}
