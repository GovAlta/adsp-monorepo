package ca.ab.gov.alberta.adsp.sdk.socket;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.HashMap;

import org.json.JSONObject;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.util.ReflectionUtils;

import ca.ab.gov.alberta.adsp.sdk.AdspId;
import ca.ab.gov.alberta.adsp.sdk.events.FullDomainEvent;

@ExtendWith(MockitoExtension.class)
class SocketEventListenerAdapterTests {

  @Test
  public void canHandleDomainEvent(@Mock TestListener listener) {
    var tenantId = AdspId.parse("urn:ads:platform:tenant-service:v2:/tenants/demo");

    var contentValues = new HashMap<String, Object>();
    contentValues.put("tenantId", tenantId.toString());
    contentValues.put("timestamp", Instant.now().toString());
    contentValues.put("payload", "{\"value\":\"configuration123\"}");
    var content = new JSONObject(contentValues);

    var method = ReflectionUtils.getDeclaredMethods(TestListener.class)[0];

    var adapter = new SocketEventListenerAdapter("test-stream", listener, method, TestPayload.class);
    adapter.onDomainEvent("configuration-service", "configuration-updated", content);

    verify(listener).onEvent(any(FullDomainEvent.class));
  }
}
