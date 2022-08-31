using Adsp.Sdk.Events;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Adsp.Sdk.Socket;

public static class SocketExtensions
{
  /// <summary>
  /// Registers services needed to subscribe for events via the push service over socket.io. Note that this does not handle stream events with mapping / projection.
  /// </summary>
  /// <typeparam name="TPayload">Type of the parameter.</typeparam>
  /// <typeparam name="TSubscriber">Type of the subscriber.</typeparam>
  /// <param name="services">Service collection.</param>
  /// <param name="streamId">ID of the push service stream to connect to.</param>
  /// <returns>Service collection.</returns>
  public static IServiceCollection AddSocketSubscriber<TPayload, TSubscriber>(this IServiceCollection services, string streamId)
    where TPayload : class
    where TSubscriber : class, IEventSubscriber<TPayload>
  {
    return AddSocketSubscriber<TPayload, TSubscriber>(services, streamId, null);
  }

  internal static IServiceCollection AddSocketSubscriber<TPayload, TSubscriber>(this IServiceCollection services, string streamId, Func<IServiceProvider, bool>? checkEnabled = null)
    where TPayload : class
    where TSubscriber : class, IEventSubscriber<TPayload>
  {
    services.AddSingleton<TSubscriber>();
    services.AddSingleton<ISubscriberService, SocketEventSubscriberService<TPayload, TSubscriber>>(
      (provider) => new SocketEventSubscriberService<TPayload, TSubscriber>(
        streamId,
        provider.GetRequiredService<ILogger<SocketEventSubscriberService<TPayload, TSubscriber>>>(),
        provider.GetRequiredService<IServiceDirectory>(),
        provider.GetRequiredService<ITokenProvider>(),
        provider.GetRequiredService<ITenantService>(),
        provider.GetRequiredService<TSubscriber>(),
        provider.GetRequiredService<IOptions<AdspOptions>>(),
        checkEnabled == null || checkEnabled(provider)
      )
    );
    services.TryAddSubscriberServices();

    return services;
  }
}
