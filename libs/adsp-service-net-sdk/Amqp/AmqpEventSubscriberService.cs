using System.Globalization;
using System.Text.Json;
using Adsp.Sdk.Errors;
using Adsp.Sdk.Events;
using Adsp.Sdk.Util;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Adsp.Sdk.Amqp;

internal class AmqpEventSubscriberService<TPayload, TSubscriber> : ISubscriberService, IDisposable
  where TPayload : class
  where TSubscriber : IEventSubscriber<TPayload>
{
  private readonly JsonSerializerOptions _serializerOptions;
  private readonly ILogger<AmqpEventSubscriberService<TPayload, TSubscriber>> _logger;
  private readonly IEventSubscriber<TPayload> _subscriber;
  private readonly string _queueName;
  private readonly ConnectionFactory _connectionFactory;
  private readonly bool _enabled;

  private IConnection? _connection;
  private IModel? _channel;
  private bool _disposed;

  public AmqpEventSubscriberService(
    string queueName,
    ILogger<AmqpEventSubscriberService<TPayload, TSubscriber>> logger,
    TSubscriber subscriber,
    IOptions<AmqpConnectionOptions> options,
    bool enabled = true
  )
  {
    _serializerOptions = new JsonSerializerOptions();
    _serializerOptions.Converters.Add(new DictionaryJsonConverter());

    _logger = logger;
    _subscriber = subscriber;
    _queueName = queueName;
    // Note: This is used to enable / disable the connection at start up but after DI registration.
    _enabled = enabled;

    _connectionFactory = new ConnectionFactory
    {
      DispatchConsumersAsync = true,
      HostName = options.Value.Hostname,
      UserName = options.Value.Username,
      Password = options.Value.Password,
      VirtualHost = options.Value.Vhost,
    };
  }

  public void Connect()
  {
    if (!_enabled)
    {
      _logger.LogInformation("Queue event subscriber for queue {Queue} is not enabled and will not be connecting.", _queueName);
      return;
    }

    _connection = _connectionFactory.CreateConnection();
    _channel = _connection.CreateModel();

    DeclareQueueConfiguration(_channel);

    var consumer = new AsyncEventingBasicConsumer(_channel);
    consumer.Received += HandleEvent;

    _channel.BasicConsume(_queueName, false, consumer);
    _logger.LogInformation("Connected to {Hostname} on queue {Queue} for domain events.", _connectionFactory.HostName, _queueName);
  }

  public void Disconnect()
  {
    IConnection? connection = _connection;
    IModel? channel = _channel;

    channel?.Dispose();
    connection?.Dispose();

    _logger.LogInformation("Disconnected from {Hostname} and queue {Queue}.", _connectionFactory.HostName, _queueName);
  }

  protected void DeclareQueueConfiguration(IModel channel)
  {
    channel.ExchangeDeclare($"{_queueName}-dead-letter", "topic", durable: true, autoDelete: false);
    channel.QueueDeclare(
      $"undelivered-{_queueName}",
      autoDelete: false,
      exclusive: false,
      durable: true,
      arguments: new Dictionary<string, object?> { { "x-queue-type", "quorum" } }
    );
    channel.QueueBind($"undelivered-{_queueName}", $"{_queueName}-dead-letter", "#");

    channel.QueueDeclare(
      _queueName,
      autoDelete: false,
      exclusive: false,
      durable: true,
      arguments: new Dictionary<string, object?> {
        { "x-queue-type", "quorum" },
        { "x-dead-letter-exchange", $"{_queueName}-dead-letter" }
      }
    );

    channel.ExchangeDeclare("domain-events", "topic", durable: true, autoDelete: false);
    channel.QueueBind(_queueName, "domain-events", "#");
  }

  private async Task HandleEvent(object sender, BasicDeliverEventArgs args)
  {
    _logger.LogDebug("Processing domain event with delivery tag {Tag}...", args.DeliveryTag);

    IModel channel = ((IAsyncBasicConsumer)sender).Model!;
    try
    {
      IDictionary<string, object?> headers = args.BasicProperties.Headers!;
      TPayload payload = ConvertMessage(headers, args.Body);
      var received = new FullDomainEvent<TPayload>(
        AdspId.Parse(headers["tenantId"] as string),
        (headers["namespace"] as string)!,
        (headers["name"] as string)!,
        DateTime.Parse((headers["timestamp"] as string)!, CultureInfo.InvariantCulture),
        payload,
        headers["correlationId"] as string,
        headers["context"] as IDictionary<string, object>
      );

      _logger.LogDebug("Signalling domain event {Namespace}:{Name} with delivery tag {Tag}...", received.Namespace, received.Name, args.DeliveryTag);

      await _subscriber.OnEvent(received);

      channel.BasicAck(args.DeliveryTag, false);
      _logger.LogInformation("Processed domain event {Namespace}:{Name} with delivery tag {Tag}.", received.Namespace, received.Name, args.DeliveryTag);
    }
    catch (Exception e)
    {
      channel.BasicNack(args.DeliveryTag, false, !args.Redelivered);
      _logger.LogWarning(e, "Failed processing domain event with delivery tag {Tag} and requeue: {Requeue}.", args.DeliveryTag, !args.Redelivered);
    }
  }

  protected virtual TPayload ConvertMessage(IDictionary<string, object?> headers, ReadOnlyMemory<byte> body)
  {
    return JsonSerializer.Deserialize<TPayload>(body.Span, _serializerOptions) is not TPayload result
      ? throw new InternalErrorException("Error encountered deserializing event message.")
      : result;
  }

  protected virtual void Dispose(bool disposing)
  {
    if (!_disposed)
    {
      if (disposing)
      {
        Disconnect();
      }
      _disposed = true;
    }
  }

  public void Dispose()
  {
    Dispose(disposing: true);
    GC.SuppressFinalize(this);
  }
}
