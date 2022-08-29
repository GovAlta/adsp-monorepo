
using System.Diagnostics.CodeAnalysis;
using SocketIOClient;

namespace Adsp.Sdk.Configuration;
[SuppressMessage("Usage", "CA1812: Avoid uninstantiated internal classes", Justification = "Instantiated by dependency injection")]
public class SocketIOWrapper
{
  public SocketIO? socketIO;

  public SocketIOWrapper(
    Uri uri,
    SocketIOOptions options
  )
  {
    socketIO = new SocketIO(uri, options);
  }

  public virtual void On(string eventName, Action<SocketIOResponse> callback)
  {
    socketIO.On(eventName, callback);
  }

  public virtual Task ConnectAsync()
  {
    return socketIO.ConnectAsync();
  }

  public virtual bool Connected()
  {
    return socketIO.Connected;
  }

  public virtual Task DisconnectAsync()
  {
    return socketIO.DisconnectAsync();
  }

  public void Dispose()
  {
    socketIO.Dispose();
  }
}