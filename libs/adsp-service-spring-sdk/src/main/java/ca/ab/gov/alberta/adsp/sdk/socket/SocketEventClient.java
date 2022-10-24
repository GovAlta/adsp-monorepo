package ca.ab.gov.alberta.adsp.sdk.socket;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;

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

  public SocketEventClient(ServiceDirectory directory, TokenProvider tokenProvider, String streamId,
      Collection<SocketEventListenerAdapter> adapters) {
    this.directory = directory;
    this.tokenProvider = tokenProvider;

    this.streamId = streamId;
    this.adapters = adapters;
  }

  public Mono<Void> connect() {
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
                  .build())
              .connect();
        }).doOnSuccess(socket -> {
          socket.on(Socket.EVENT_CONNECT, e -> {
            this.logger.debug("Connected to stream {}.", this.streamId);
          });
          socket.on(Socket.EVENT_CONNECT_ERROR, e -> {
            this.logger.debug("Error encountered connecting to stream {}: {}", this.streamId, e);
          });
          socket.on(Socket.EVENT_DISCONNECT, e -> {
            this.logger.debug("Disconnected from stream {}.", this.streamId);
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
      Socket socket;
      synchronized (this.socketLock) {
        socket = this.socket;
      }

      if (socket != null) {
        socket.close();
      }

      return Mono.empty();
    });
  }
}
