
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using static System.Net.Mime.MediaTypeNames;

namespace Adsp.Sdk.Errors;

internal static class HttpResponseExceptionHandler
{
  internal static async Task Handle(HttpContext context)
  {
    // using static System.Net.Mime.MediaTypeNames;
    context.Response.ContentType = Application.Json;

    var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();

    var responseException = exceptionHandlerPathFeature?.Error as HttpResponseException;
    if (responseException != null)
    {
      context.Response.StatusCode = (int)responseException.Status;
      await context.Response.WriteAsJsonAsync(new { error = responseException.Message });
    }
    else
    {
      context.Response.StatusCode = StatusCodes.Status500InternalServerError;
      await context.Response.WriteAsJsonAsync(new { error = "Unexpected error." });
    }
  }
}
