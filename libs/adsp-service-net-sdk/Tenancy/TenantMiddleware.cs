using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;

namespace Adsp.Sdk.Tenancy;

internal sealed class TenantMiddleware
{
  private const string TenantQueryParameter = "tenantId";
  public const string TenantContextKey = "ADSP:Tenant";

  private readonly ILogger<TenantMiddleware> _logger;
  private readonly ITenantService _tenantService;
  private readonly RequestDelegate _next;

  public TenantMiddleware(
    ILogger<TenantMiddleware> logger,
    ITenantService tenantService,
    RequestDelegate next
  )
  {
    _logger = logger;
    _tenantService = tenantService;
    _next = next;
  }

  public async Task InvokeAsync(HttpContext httpContext)
  {
    if (httpContext == null)
    {
      throw new ArgumentNullException(nameof(httpContext));
    }

    var user = httpContext.GetAdspUser();
    AdspId? tenantId = user?.Tenant?.Id;
    if (
      user?.IsCore == true &&
      httpContext.Request.Query.TryGetValue(TenantQueryParameter, out StringValues tenantIdValue) &&
      tenantIdValue.Count == 1
    )
    {
      tenantId = AdspId.Parse(tenantIdValue[0]);

      _logger.LogDebug(
        "Core user {User} (ID: {UserId}) made request in tenant context ({TenantId}) for {Method}: {Resource}",
        user.Name,
        user.Id,
        tenantId,
        httpContext.Request.Method?.Replace(Environment.NewLine, "", StringComparison.Ordinal),
        httpContext.Request.Path.ToString().Replace(Environment.NewLine, "", StringComparison.Ordinal)
      );
    }

    if (tenantId != null)
    {
      httpContext.Items.Add(TenantContextKey, (tenantId, _tenantService));

      _logger.LogTrace("Added tenant capabilities to the context for {TenantId}.", tenantId);
    }

    await _next(httpContext);
  }
}
