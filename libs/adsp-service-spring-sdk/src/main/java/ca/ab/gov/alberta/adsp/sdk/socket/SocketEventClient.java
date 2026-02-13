package ca.ab.gov.alberta.adsp.sdk.socket;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.util.UriComponentsBuilder;

import ca.ab.gov.alberta.adsp.sdk.PlatformServices;
import ca.ab.gov.alberta.adsp.sdk.access.TokenProvider;
import ca.ab.gov.alberta.adsp.sdk.directory.ServiceDirectory;
import io.socket.client.IO;
import io.socket.client.Socket;
import reactor.core.publisher.Mono;

class SocketEventClient {
  private final Logger logger = LoggerFactory.getLogger(SocketEventClient.class);
  private final ServiceDirectory directory;
  private final TokenProvider tokenProvider;

  private final String streamId;
  private final Collection<SocketEventListenerAdapter> adapters;

  private final Object socketLock = new Object();
  private Socket socket;
  private final AtomicBoolean intentionalDisconnect = new AtomicBoolean(false);

  private static final Duration RECONNECT_DELAY = Duration.ofSeconds(5);

  public SocketEventClient(ServiceDirectory directory, TokenProvider tokenProvider, String streamId,
      Collection<SocketEventListenerAdapter> adapters) {
    this.directory = directory;
    this.tokenProvider = tokenProvider;

    this.streamId = streamId;
    this.adapters = adapters;
  }

  public Mono<Void> connect() {
    this.intentionalDisconnect.set(false);
    return Mono.zip(
        this.directory.getServiceUrl(PlatformServices.PushServiceId),
        this.tokenProvider.getAccessToken()).map(values -> {
          var streamUri = UriComponentsBuilder.fromUri(values.getT1()).build("");

          var token = values.getT2();
          var authorization = new ArrayList<String>();
          authorization.add("Bearer " + token);
          var headers = new HashMap<String, List<String>>();
          headers.put("Authorization", authorization);

          return IO.socket(
              streamUri,
              IO.Options.builder()
                  .setQuery("stream=" + streamId)
                  .setSecure(true)
                  .setExtraHeaders(headers)
                  // Disable auto-reconnect; we handle reconnection explicitly with fresh token.
                  .setReconnection(false)
                  // Setting transport to websocket since long polling seems to have issues.
                  .setTransports(new String[] { "websocket" })
                  .build())
              .connect();
        }).doOnSuccess(socket -> {
          socket.on(Socket.EVENT_CONNECT, e -> {
            this.logger.info("Connected to stream {}.", this.streamId);
          });
          socket.on(Socket.EVENT_CONNECT_ERROR, e -> {
            this.logger.warn("Error encountered connecting to stream {}: {}", this.streamId, e);
          });
          socket.on(Socket.EVENT_DISCONNECT, e -> {
            this.logger.info("Disconnected from stream {}.", this.streamId);
            synchronized (this.socketLock) {
              this.socket = null;
            }
            // Reconnect with fresh token unless disconnect was intentional.
            if (!this.intentionalDisconnect.get()) {
              this.logger.info("Reconnecting to stream {} in {} seconds...", this.streamId, RECONNECT_DELAY.toSeconds());
              Mono.delay(RECONNECT_DELAY)
                  .then(this.connect())
                  .doOnError(err -> this.logger.error("Error reconnecting to stream {}: {}", this.streamId, err.getMessage()))
                  .subscribe();
            }
          });
          socket.onAnyIncoming((args) -> this.onIncoming((String) args[0], (JSONObject) args[1]));
          synchronized (this.socketLock) {
            this.socket = socket;
          }
        }).then();
  }

  private void onIncoming(String event, JSONObject value) {
    var eventName = event.split(":");
    if (eventName.length == 2 && value != null) {
      this.adapters.forEach(adapter -> adapter.onDomainEvent(eventName[0], eventName[1], value));
    }
  }

  public Mono<Void> disconnect() {
    return Mono.defer(() -> {
      this.intentionalDisconnect.set(true);
      Socket socket;
      synchronized (this.socketLock) {
        socket = this.socket;
        this.socket = null;
      }

      if (socket != null) {
        socket.close();
      }

      return Mono.empty();
    });
  }
}
