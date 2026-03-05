package ca.ab.gov.alberta.adsp.sdk.utils;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.deser.std.StdDeserializer;

import ca.ab.gov.alberta.adsp.sdk.AdspId;

/**
 * Jackson 3.x deserializer for AdspId.
 * This is needed because Spring Boot 4 uses Jackson 3.x for WebFlux codecs.
 */
public class AdspIdDeserializer3 extends StdDeserializer<AdspId> {

  public AdspIdDeserializer3() {
    super(AdspId.class);
  }

  @Override
  public AdspId deserialize(JsonParser parser, DeserializationContext context) throws JacksonException {
    return AdspId.parse(parser.readValueAs(String.class));
  }
}
