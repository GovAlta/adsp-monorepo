using System.Text;
using System.Text.Json;
using Adsp.Sdk.Events;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace Adsp.Sdk.Amqp;

public static class AmqpExtensions
{
  /// <summary>
  /// Registers services needed to receive events by AMQP.
  /// </summary>
  /// <typeparam name="TPayload">Type of the payload.</typeparam>
  /// <typeparam name="TSubscriber">Type of the subscriber.</typeparam>
  /// <param name="services">Service collection.</param>
  /// <param name="queueName">Name of the queue to declare.</param>
  /// <returns>Service collection</returns>
  public static IServiceCollection AddQueueSubscriber<TPayload, TSubscriber>(this IServiceCollection services, string queueName)
    where TPayload : class
    where TSubscriber : class, IEventSubscriber<TPayload>
  {
    services.AddSingleton<TSubscriber>();
    services.AddSingleton<ISubscriberService, AmqpEventSubscriberService<TPayload, TSubscriber>>(
      (providers) =>
      {
        IOptions<AmqpConnectionOptions> options = providers.GetRequiredService<IOptions<AmqpConnectionOptions>>();
        return new AmqpEventSubscriberService<TPayload, TSubscriber>(
          queueName,
          providers.GetRequiredService<ILogger<AmqpEventSubscriberService<TPayload, TSubscriber>>>(),
          providers.GetRequiredService<TSubscriber>(),
          options,
          !String.IsNullOrEmpty(options.Value.Hostname)
        );
      }
    );
    services.TryAddSubscriberServices();
    return services;
  }

  /// <summary>
  /// Registers services needed to receive events by AMQP.
  /// </summary>
  /// <typeparam name="TSubscriber">Type of the subscriber that handles event payload as a dictionary.</typeparam>
  /// <param name="services">Service collection.</param>
  /// <param name="queueName">Name of the queue to declare.</param>
  /// <returns>Service collection</returns>
  public static IServiceCollection AddQueueSubscriber<TSubscriber>(this IServiceCollection services, string queueName)
    where TSubscriber : class, IEventSubscriber<IDictionary<string, object?>>
  {
    return AddQueueSubscriber<IDictionary<string, object?>, TSubscriber>(services, queueName);
  }

  /// <summary>
  /// Checks if a domain event matches the identity.
  /// </summary>
  /// <typeparam name="TPayload">Type of the payload.</typeparam>
  /// <param name="identity">Event identity.</param>
  /// <param name="received">Received domain event.</param>
  /// <returns>True if the specified domain event matches the identity.</returns>
  public static bool IsMatch<TPayload>(this EventIdentity identity, FullDomainEvent<TPayload>? received) where TPayload : class
  {
    return identity != null &&

        received != null &&
        String.Equals(identity.Namespace, received.Namespace, StringComparison.Ordinal) &&
        String.Equals(identity.Name, received.Name, StringComparison.Ordinal) &&
        (
          identity.Criteria?.CorrelationId == null ||
          String.Equals(identity.Criteria?.CorrelationId, received.CorrelationId, StringComparison.Ordinal)
        ) &&
        (
          identity.Criteria?.Context == null ||
          !identity.Criteria.Context.Any(c => received.Context == null ||
              !received.Context.TryGetValue(c.Key, out var value) ||
              !Equals(value, c.Value))
        );
  }

  internal static T? GetHeaderValueOrDefault<T>(this IBasicProperties properties, string key, JsonSerializerOptions options)
  {
    T? result = default;
    if (properties.Headers?.TryGetValue(key, out var raw) == true)
    {
      if (raw is T typedValue)
      {
        result = typedValue;
      }
      else if (raw is byte[] bytes)
      {
        var stringValue = Encoding.UTF8.GetString(bytes);
        if (typeof(T) == typeof(string))
        {
          result = (T)(object)stringValue;
        }
        else
        {
          result = JsonSerializer.Deserialize<T>(stringValue, options);
        }
      }
    }

    return result;
  }
}
