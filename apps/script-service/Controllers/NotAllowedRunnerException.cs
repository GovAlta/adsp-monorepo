
using System.Net;
using Adsp.Sdk;
using Adsp.Sdk.Errors;

namespace Adsp.Platform.ScriptService.Controller;

internal sealed class NotAllowedRunnerException : HttpResponseException
{

  public NotAllowedRunnerException()
  {
  }

  public NotAllowedRunnerException(string message) :
    base(HttpStatusCode.Forbidden, message)
  {
  }

  public NotAllowedRunnerException(string message, Exception innerException) : base(HttpStatusCode.Forbidden, message, innerException)
  {
  }

  public NotAllowedRunnerException(User? user) :
    this($"User {user?.Name} ({user?.Id}) is not allowed to run script.")
  {
  }

  public NotAllowedRunnerException(User? user, Exception innerException) :
    this($"User {user?.Name} ({user?.Id}) is not allowed to run script.", innerException)
  {
  }
}
