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

internal class AmqpEventSubscriberService<TPayload, TSubscriber> : ISubscriberService, IAsyncDisposable
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
  private IChannel? _channel;
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
      HostName = options.Value.Hostname,
      UserName = options.Value.Username,
      Password = options.Value.Password,
      VirtualHost = options.Value.Vhost,
    };
  }

  public async Task StartAsync(CancellationToken cancellationToken)
  {
    if (!_enabled)
    {
      _logger.LogInformation("Queue event subscriber for queue {Queue} is not enabled and will not be connecting.", _queueName);
      return;
    }

    _connection = await _connectionFactory.CreateConnectionAsync(cancellationToken);
    _channel = await _connection.CreateChannelAsync(cancellationToken: cancellationToken);

    await DeclareQueueConfigurationAsync(_channel, cancellationToken);

    var consumer = new AsyncEventingBasicConsumer(_channel);
    consumer.ReceivedAsync += HandleEventAsync;

    await _channel.BasicConsumeAsync(_queueName, false, consumer, cancellationToken);
    _logger.LogInformation("Connected to {Hostname} on queue {Queue} for domain events.", _connectionFactory.HostName, _queueName);
  }

  public async Task StopAsync(CancellationToken cancellationToken)
  {
    IConnection? connection = _connection;
    IChannel? channel = _channel;

    if (channel != null)
    {
      await channel.CloseAsync(cancellationToken);
      await channel.DisposeAsync();
    }
    if (connection != null)
    {
      await connection.CloseAsync(cancellationToken);
      await connection.DisposeAsync();
    }

    _logger.LogInformation("Disconnected from {Hostname} and queue {Queue}.", _connectionFactory.HostName, _queueName);
  }

  protected async Task DeclareQueueConfigurationAsync(IChannel channel, CancellationToken cancellationToken)
  {
    await channel.ExchangeDeclareAsync($"{_queueName}-dead-letter", "topic", durable: true, autoDelete: false, cancellationToken: cancellationToken);
    await channel.QueueDeclareAsync(
      $"undelivered-{_queueName}",
      autoDelete: false,
      exclusive: false,
      durable: true,
      arguments: new Dictionary<string, object?> { { "x-queue-type", "quorum" } },
      cancellationToken: cancellationToken
    );
    await channel.QueueBindAsync($"undelivered-{_queueName}", $"{_queueName}-dead-letter", "#", cancellationToken: cancellationToken);

    await channel.QueueDeclareAsync(
      _queueName,
      autoDelete: false,
      exclusive: false,
      durable: true,
      arguments: new Dictionary<string, object?> {
        { "x-queue-type", "quorum" },
        { "x-dead-letter-exchange", $"{_queueName}-dead-letter" }
      },
      cancellationToken: cancellationToken
    );

    await channel.ExchangeDeclareAsync("domain-events", "topic", durable: true, autoDelete: false, cancellationToken: cancellationToken);
    await channel.QueueBindAsync(_queueName, "domain-events", "#", cancellationToken: cancellationToken);
  }

  private async Task HandleEventAsync(object sender, BasicDeliverEventArgs args)
  {
    _logger.LogDebug("Processing domain event with delivery tag {Tag}...", args.DeliveryTag);

    IChannel channel = ((IAsyncBasicConsumer)sender).Channel;
    try
    {
      TPayload payload = ConvertMessage(new Dictionary<string, object?>(args.BasicProperties.Headers ?? new Dictionary<string, object?>()), args.Body);
      var received = new FullDomainEvent<TPayload>(
        AdspId.Parse(args.BasicProperties.GetHeaderValueOrDefault<string>("tenantId", _serializerOptions)),
        args.BasicProperties.GetHeaderValueOrDefault<string>("namespace", _serializerOptions)!,
        args.BasicProperties.GetHeaderValueOrDefault<string>("name", _serializerOptions)!,
        DateTime.Parse(args.BasicProperties.GetHeaderValueOrDefault<string>("timestamp", _serializerOptions)!, CultureInfo.InvariantCulture),
        payload,
        args.BasicProperties.GetHeaderValueOrDefault<string>("correlationId", _serializerOptions),
        args.BasicProperties.GetHeaderValueOrDefault<IDictionary<string, object>>("context", _serializerOptions)
      );

      _logger.LogDebug("Signalling domain event {Namespace}:{Name} with delivery tag {Tag}...", received.Namespace, received.Name, args.DeliveryTag);

      await _subscriber.OnEvent(received);

      await channel.BasicAckAsync(args.DeliveryTag, false);
      _logger.LogInformation("Processed domain event {Namespace}:{Name} with delivery tag {Tag}.", received.Namespace, received.Name, args.DeliveryTag);
    }
    catch (Exception e)
    {
      await channel.BasicNackAsync(args.DeliveryTag, false, !args.Redelivered);
      _logger.LogWarning(e, "Failed processing domain event with delivery tag {Tag} and requeue: {Requeue}.", args.DeliveryTag, !args.Redelivered);
    }
  }

  protected virtual TPayload ConvertMessage(IDictionary<string, object?> headers, ReadOnlyMemory<byte> body)
  {
    return JsonSerializer.Deserialize<TPayload>(body.Span, _serializerOptions) is not TPayload result
      ? throw new InternalErrorException("Error encountered deserializing event message.")
      : result;
  }

  public async ValueTask DisposeAsync()
  {
    if (!_disposed)
    {
      await StopAsync(CancellationToken.None);
      _disposed = true;
    }
    GC.SuppressFinalize(this);
  }
}
