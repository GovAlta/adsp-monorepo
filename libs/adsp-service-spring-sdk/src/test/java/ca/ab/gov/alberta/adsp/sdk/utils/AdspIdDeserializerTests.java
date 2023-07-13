package ca.ab.gov.alberta.adsp.sdk.utils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import java.io.IOException;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;

import ca.ab.gov.alberta.adsp.sdk.ResourceType;

@ExtendWith(MockitoExtension.class)
class AdspIdDeserializerTests {
  @Test
  public void canDeserialize(@Mock JsonParser parser, @Mock DeserializationContext context) throws JacksonException, IOException {
    when(parser.readValueAs(String.class)).thenReturn("urn:ads:platform:test-service");

    var deserializer = new AdspIdDeserializer();
    var result = deserializer.deserialize(parser, context);
    assertNotNull(result);
    assertEquals(result.getType(), ResourceType.Service);
    assertEquals(result.getService(), "test-service");
  }
}
