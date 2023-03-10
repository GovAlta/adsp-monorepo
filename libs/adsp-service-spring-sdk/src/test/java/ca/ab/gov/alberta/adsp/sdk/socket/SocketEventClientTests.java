package ca.ab.gov.alberta.adsp.sdk.socket;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.client.IO.Options;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
class SocketEventClientTests {
  @Test
  public void canConnect(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock Collection<SocketEventListenerAdapter> adapters, @Mock Socket socket) throws URISyntaxException {

    when(directory.getServiceUrl(PlatformServices.PushServiceId)).thenReturn(Mono.just(new URI("https://push-service")));
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(socket.connect()).thenReturn(socket);

    try (MockedStatic<IO> utilities = Mockito.mockStatic(IO.class)) {
      utilities.when(() -> IO.socket(any(URI.class), any(Options.class))).thenReturn(socket);

      var client = new SocketEventClient(directory, tokenProvider, "test-stream", adapters);
      client.connect().blockOptional();

      verify(socket).connect();
    }
  }

  @Test
  public void canDisconnect(@Mock ServiceDirectory directory, @Mock TokenProvider tokenProvider,
      @Mock Collection<SocketEventListenerAdapter> adapters, @Mock Socket socket) throws URISyntaxException {

    when(directory.getServiceUrl(PlatformServices.PushServiceId)).thenReturn(Mono.just(new URI("https://push-service")));
    when(tokenProvider.getAccessToken()).thenReturn(Mono.just("token"));
    when(socket.connect()).thenReturn(socket);
    when(socket.close()).thenReturn(socket);

    try (MockedStatic<IO> utilities = Mockito.mockStatic(IO.class)) {
      utilities.when(() -> IO.socket(any(URI.class), any(Options.class))).thenReturn(socket);

      var client = new SocketEventClient(directory, tokenProvider, "test-stream", adapters);
      client.connect().blockOptional();
      client.disconnect().blockOptional();

      verify(socket).close();
    }
  }
}
