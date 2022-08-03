namespace Adsp.Sdk;
public class DomainEvent<TPayload> where TPayload : class
{
  private readonly string _name;
  private readonly DateTime _timestamp;
  private readonly string? _correlationId;
  private readonly TPayload _payload;

  public string Name
  {
    get { return _name; }
  }

  public DateTime Timestamp
  {
    get { return _timestamp; }
  }

  public string? CorrelationId
  {
    get { return _correlationId; }
  }

  public TPayload Payload
  {
    get { return _payload; }
  }

  public DomainEvent(string name, DateTime timestamp, TPayload payload, string? correlationId = null)
  {
    _name = name;
    _timestamp = timestamp;
    _correlationId = correlationId;
    _payload = payload;
  }
}
