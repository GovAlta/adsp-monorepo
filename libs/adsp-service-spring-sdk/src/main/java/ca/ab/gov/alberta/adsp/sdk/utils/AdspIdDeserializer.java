package ca.ab.gov.alberta.adsp.sdk.utils;

import java.io.IOException;

import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;

import ca.ab.gov.alberta.adsp.sdk.AdspId;

public class AdspIdDeserializer extends StdDeserializer<AdspId> {

  protected AdspIdDeserializer() {
    super(AdspId.class);
  }

  @Override
  public AdspId deserialize(JsonParser parser, DeserializationContext context) throws IOException, JacksonException {
    return AdspId.parse(parser.readValueAs(String.class));
  }
}
