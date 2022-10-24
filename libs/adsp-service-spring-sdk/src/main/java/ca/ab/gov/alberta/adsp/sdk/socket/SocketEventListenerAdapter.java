package ca.ab.gov.alberta.adsp.sdk.socket;

import java.lang.reflect.Method;
import java.time.Instant;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.events.FullDomainEvent;

class SocketEventListenerAdapter {

  private final Logger logger = LoggerFactory.getLogger(SocketEventListenerAdapter.class);
  private final ObjectMapper mapper = JsonMapper.builder()
      .findAndAddModules()
      .build();

  private final String streamId;
  private final Object bean;
  private final Method method;
  private final Class<?> payloadType;

  public String getStreamId() {
    return streamId;
  }

  public SocketEventListenerAdapter(String streamId, Object bean, Method method, Class<?> payloadType) {
    this.streamId = streamId;
    this.bean = bean;
    this.method = method;
    this.payloadType = payloadType;
  }

  public void onDomainEvent(String namespace, String name, JSONObject content) {
    try {
      var tenantId = content.has("tenantId") ? AdspId.parse(content.getString("tenantId")) : null;
      var timestamp = Instant.parse(content.getString("timestamp"));
      var payloadValue = content.get("payload");

      var payload = mapper.readValue(payloadValue.toString(), payloadType);
      var event = new FullDomainEvent<>(tenantId, namespace, name, timestamp, payload);

      method.invoke(this.bean, event);
    } catch (Exception e) {
      this.logger.error("Error encountered invoking socket event listener on {}::{}.",
          method.getDeclaringClass().getName(),
          method.getName(), e);
    }
  }
}
